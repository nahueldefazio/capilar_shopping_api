import { Controller, Post, Body } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { CreateOrderDto } from './dto/checkout.dto';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * POST /checkout/create-order
   * Punto de entrada público desde el frontend.
   * Valida stock, calcula total server-side y crea la orden.
   */
  @Post('create-order')
  createOrder(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }
}
