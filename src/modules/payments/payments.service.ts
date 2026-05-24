import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { OrdersService } from '../orders/orders.service';
import { PaymentProvider, PaymentStatus } from '../../common/enums/payment.enum';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    private readonly ordersService: OrdersService,
  ) {}

  /**
   * Crea una preferencia de pago en Mercado Pago.
   *
   * TODO: Integrar SDK de Mercado Pago cuando el backend esté en producción:
   *   1. npm install mercadopago
   *   2. import MercadoPagoConfig, { Preference } from 'mercadopago'
   *   3. const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN })
   *   4. const preference = new Preference(client)
   *   5. const result = await preference.create({ body: { items, back_urls, auto_return } })
   *   6. Retornar result.init_point al frontend para redirigir al usuario
   */
  async createMercadoPagoPreference(orderId: number): Promise<{ preferenceId: string; initPoint: string }> {
    const order = await this.ordersService.findOne(orderId);

    this.logger.log(`[MP] Creating preference for order ${order.orderNumber}`);

    // ── PLACEHOLDER ──────────────────────────────────────────────────────────
    // Reemplazar este bloque con la llamada real al SDK de Mercado Pago.
    // El accessToken viene de process.env.MERCADOPAGO_ACCESS_TOKEN
    // ─────────────────────────────────────────────────────────────────────────
    const mockPreferenceId = `MOCK-PREF-${order.orderNumber}`;
    const mockInitPoint = `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${mockPreferenceId}`;

    return { preferenceId: mockPreferenceId, initPoint: mockInitPoint };
  }

  /**
   * Webhook de Mercado Pago.
   *
   * TODO: Cuando Mercado Pago esté integrado:
   *   1. Validar la firma del webhook con MERCADOPAGO_WEBHOOK_SECRET
   *   2. Consultar la API de MP para obtener el estado real del pago
   *   3. Actualizar paymentStatus de la orden según el estado
   *   4. El stock se descuenta automáticamente en ordersService.updatePaymentStatus()
   */
  async handleMercadoPagoWebhook(payload: Record<string, unknown>): Promise<void> {
    this.logger.log('[MP Webhook] Received payload:', JSON.stringify(payload));

    // Guardar el payload crudo para auditoría
    if (payload.type === 'payment' && payload.data) {
      const data = payload.data as Record<string, unknown>;
      const providerPaymentId = String(data.id ?? '');

      await this.paymentRepo.save(
        this.paymentRepo.create({
          provider: PaymentProvider.MERCADOPAGO,
          providerPaymentId,
          status: PaymentStatus.PENDING, // actualizar luego con el estado real
          amount: 0,
          rawResponse: payload,
        }),
      );

      // TODO: Buscar la orden por external_reference, verificar estado en MP API
      // y llamar a ordersService.updatePaymentStatus(orderId, { paymentStatus: PaymentStatus.APPROVED })
    }
  }
}
