import {
  Controller, Post, Body, Query, Headers,
  ParseIntPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('mercadopago/create-preference')
  createPreference(@Body('orderId', ParseIntPipe) orderId: number) {
    return this.paymentsService.createMercadoPagoPreference(orderId);
  }

  @Post('mercadopago/webhook')
  @HttpCode(HttpStatus.OK)
  webhook(
    @Body() body: Record<string, unknown>,
    @Query() query: Record<string, string>,
    @Headers('x-signature') xSignature: string,
    @Headers('x-request-id') xRequestId: string,
  ) {
    return this.paymentsService.handleMercadoPagoWebhook(body, query, xSignature, xRequestId);
  }
}
