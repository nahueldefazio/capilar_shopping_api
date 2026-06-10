import { EmailsService } from '../emails/emails.service';
import { WithdrawalRequestDto } from './dto/withdrawal-request.dto';
export declare class LegalController {
    private readonly emailsService;
    constructor(emailsService: EmailsService);
    createWithdrawalRequest(dto: WithdrawalRequestDto): Promise<{
        code: string;
    }>;
}
