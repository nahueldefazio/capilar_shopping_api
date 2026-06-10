import { Body, Controller, Post } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { EmailsService } from '../emails/emails.service';
import { WithdrawalRequestDto } from './dto/withdrawal-request.dto';

@Controller('legal')
export class LegalController {
  constructor(private readonly emailsService: EmailsService) {}

  @Post('arrepentimiento')
  async createWithdrawalRequest(@Body() dto: WithdrawalRequestDto): Promise<{ code: string }> {
    const code = `ARR-${Date.now().toString(36).toUpperCase()}-${randomBytes(2)
      .toString('hex')
      .toUpperCase()}`;

    await this.emailsService.sendLegalRequest({
      type: 'arrepentimiento',
      code,
      ...dto,
    });

    return { code };
  }
}
