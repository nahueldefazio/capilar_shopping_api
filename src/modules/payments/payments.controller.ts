import {
  Controller, Post, Body, Param,
  ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * POST /payments/mercadopago/create-preference
   * Crea una preferencia de pago en MP y retorna el init_point.
   * El frontend redirige al usuario a init_point para pagar.
   */
  @Post('mercadopago/create-preference')
  createPreference(@Body('orderId', ParseIntPipe) orderId: number) {
    return this.paymentsService.createMercadoPagoPreference(orderId);
  }

  /**
   * POST /payments/mercadopago/webhook
   * Mercado Pago llama a este endpoint cuando cambia el estado de un pago.
   * Configurar la URL en el panel de MP: https://tu-api.com/payments/mercadopago/webhook
   */
  @Post('mercadopago/webhook')
  @HttpCode(HttpStatus.OK)
  webhook(@Body() payload: Record<string, unknown>) {
    return this.paymentsService.handleMercadoPagoWebhook(payload);
  }
}
