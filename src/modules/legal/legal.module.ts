import { Module } from '@nestjs/common';
import { EmailsModule } from '../emails/emails.module';
import { LegalController } from './legal.controller';

@Module({
  imports: [EmailsModule],
  controllers: [LegalController],
})
export class LegalModule {}
