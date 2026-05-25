import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    createPreference(orderId: number): Promise<{
        preferenceId: string;
        initPoint: string;
    }>;
    webhook(payload: Record<string, unknown>): Promise<void>;
}
