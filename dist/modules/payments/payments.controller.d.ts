import { PaymentsService } from './payments.service';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    createPreference(orderId: number): Promise<{
        preferenceId: string;
        initPoint: string;
    }>;
    webhook(body: Record<string, unknown>, query: Record<string, string>, xSignature: string, xRequestId: string): Promise<void>;
}
