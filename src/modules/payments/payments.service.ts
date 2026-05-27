import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
          success: `${frontendUrl}/pago-resultado`,
          failure: `${frontendUrl}/pago-resultado`,
          pending: `${frontendUrl}/pago-resultado`,
        },
        auto_return: 'approved',
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

  async handleMercadoPagoWebhook(
    body: Record<string, unknown>,
    query: Record<string, string>,
  ): Promise<void> {
    // MP envía el pago como body JSON { type: 'payment', data: { id: '...' } }
    // o como query params ?topic=payment&id=...
    const type = (body.type ?? query.topic) as string;
    const paymentId = String((body.data as Record<string, unknown>)?.id ?? query.id ?? '');

    this.logger.log(`[MP Webhook] type=${type} paymentId=${paymentId}`);

    if (type !== 'payment' || !paymentId) return;

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
