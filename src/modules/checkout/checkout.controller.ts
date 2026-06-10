import { Controller, Post, Get, Body, Param, ParseIntPipe, Query } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { CreateOrderDto } from './dto/checkout.dto';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('create-order')
  createOrder(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Get('order/:id')
  getOrder(@Param('id', ParseIntPipe) id: number, @Query('token') token: string) {
    return this.ordersService.findOnePublic(id, token);
  }
}
