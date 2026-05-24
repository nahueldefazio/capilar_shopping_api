import { Module } from '@nestjs/common';
import { CheckoutController } from './checkout.controller';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [OrdersModule],
  controllers: [CheckoutController],
})
export class CheckoutModule {}
