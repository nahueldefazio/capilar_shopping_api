import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHmac } from 'crypto';
import MercadoPagoConfig, { Preference, Payment as MPPayment } from 'mercadopago';
import { Payment } from './entities/payment.entity';
import { OrdersService } from '../orders/orders.service';
import { PaymentProvider, PaymentStatus } from '../../common/enums/payment.enum';
import { OrderStatus } from '../../common/enums/order-status.enum';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly mp: MercadoPagoConfig;

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly ordersService: OrdersService,
  ) {
    this.mp = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ?? '',
    });
  }

  async createMercadoPagoPreference(orderId: number): Promise<{ preferenceId: string; initPoint: string }> {
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
      throw new BadRequestException('Mercado Pago no esta configurado');
    }

    const order = await this.ordersService.findOne(orderId);
    this.logger.log(`[MP] Creating preference for order ${order.orderNumber}`);

    const frontendUrl = process.env.FRONTEND_URL ?? 'https://lemonchiffon-goldfish-284566.hostingersite.com';
    const apiUrl = process.env.API_URL ?? 'https://navajowhite-quetzal-176085.hostingersite.com';

    const preferenceApi = new Preference(this.mp);
    const result = await preferenceApi.create({
      body: {
        external_reference: order.orderNumber,
        items: order.items.map((item) => ({
          id: String(item.productId ?? item.id),
          title: item.productName,
          unit_price: Number(item.unitPrice),
          quantity: item.quantity,
          currency_id: 'ARS',
        })),
        payer: {
          name: order.customer?.fullName ?? '',
          email: order.customer?.email ?? '',
        },
        back_urls: {
          success: `${frontendUrl}/pago-resultado?order_id=${order.id}&token=${order.publicToken}`,
          failure: `${frontendUrl}`,
          pending: `${frontendUrl}/pago-resultado?order_id=${order.id}&token=${order.publicToken}`,
        },
        auto_return: 'approved',
        statement_descriptor: 'Capilar Shopping',
        notification_url: `${apiUrl}/api/payments/mercadopago/webhook`,
      },
    });

    if (!result.id || !result.init_point) {
      throw new BadRequestException('No se pudo crear la preferencia de pago en Mercado Pago');
    }

    await this.ordersService.updateStatus(orderId, { status: OrderStatus.PENDING_PAYMENT });

    this.logger.log(`[MP] Preference created: ${result.id} for order ${order.orderNumber}`);
    return { preferenceId: result.id, initPoint: result.init_point };
  }

  private verifyMPSignature(
    xSignature: string,
    xRequestId: string,
    dataId: string,
  ): boolean {
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (!secret) return process.env.NODE_ENV !== 'production';
    if (!xSignature) return false;

    const parts = Object.fromEntries(
      xSignature.split(',').map((p) => p.trim().split('=')),
    ) as { ts?: string; v1?: string };

    if (!parts.ts || !parts.v1) return false;

    const manifest = `id:${dataId};request-id:${xRequestId};ts:${parts.ts};`;
    const expected = createHmac('sha256', secret).update(manifest).digest('hex');
    return expected === parts.v1;
  }

  async handleMercadoPagoWebhook(
    body: Record<string, unknown>,
    query: Record<string, string>,
    xSignature = '',
    xRequestId = '',
  ): Promise<void> {
    // MP sends type in body.type (new format) or query.type/query.topic (IPN format)
    const type = (body.type ?? query.type ?? query.topic) as string;
    // MP sends data.id as query param "data.id" (new format) or body.data.id, fallback to query.id (IPN)
    const paymentId = String(
      (body.data as Record<string, unknown>)?.id ??
      query['data.id'] ??
      query.id ??
      '',
    );
    // Signature validation uses query param data.id per MP docs
    const signatureDataId = query['data.id'] ?? paymentId;

    this.logger.log(`[MP Webhook] type=${type} paymentId=${paymentId}`);

    if (type !== 'payment' || !paymentId) return;

    if (!this.verifyMPSignature(xSignature, xRequestId, signatureDataId)) {
      this.logger.warn('[MP Webhook] Invalid signature — request ignored');
      return;
    }

    try {
      const mpApi = new MPPayment(this.mp);
      const paymentInfo = await mpApi.get({ id: paymentId });

      const orderNumber = paymentInfo.external_reference;
      if (!orderNumber) {
        this.logger.warn(`[MP Webhook] No external_reference in payment ${paymentId}`);
        return;
      }

      const order = await this.ordersService.findByOrderNumber(orderNumber);
      if (!order) {
        this.logger.warn(`[MP Webhook] Order not found for reference ${orderNumber}`);
        return;
      }

      const newStatus = this.mapMPStatus(paymentInfo.status ?? '');

      await this.paymentRepo.save(
        this.paymentRepo.create({
          orderId: order.id,
          provider: PaymentProvider.MERCADOPAGO,
          providerPaymentId: paymentId,
          status: newStatus,
          amount: Number(paymentInfo.transaction_amount ?? 0),
          rawResponse: paymentInfo as unknown as Record<string, unknown>,
        }),
      );

      await this.ordersService.updatePaymentStatus(order.id, { paymentStatus: newStatus });

      this.logger.log(`[MP Webhook] Order ${orderNumber} payment status → ${newStatus}`);
    } catch (err) {
      this.logger.error('[MP Webhook] Error processing webhook:', err);
    }
  }

  private mapMPStatus(mpStatus: string): PaymentStatus {
    switch (mpStatus) {
      case 'approved':  return PaymentStatus.APPROVED;
      case 'rejected':
      case 'cancelled': return PaymentStatus.REJECTED;
      case 'refunded':  return PaymentStatus.REFUNDED;
      default:          return PaymentStatus.PENDING;
    }
  }
}
