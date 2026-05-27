import { Controller, Post, Get, Body } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { CalculateShippingDto } from './dto/calculate-shipping.dto';

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Post('calculate')
  calculate(@Body() dto: CalculateShippingDto) {
    return this.shippingService.calculate(dto);
  }

  @Get('rates')
  getRates() {
    return this.shippingService.getRates();
  }
}
