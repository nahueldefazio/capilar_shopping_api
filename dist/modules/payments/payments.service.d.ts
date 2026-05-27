import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { OrdersService } from '../orders/orders.service';
export declare class PaymentsService {
    private readonly paymentRepo;
    private readonly ordersService;
    private readonly logger;
    private readonly mp;
    constructor(paymentRepo: Repository<Payment>, ordersService: OrdersService);
    createMercadoPagoPreference(orderId: number): Promise<{
        preferenceId: string;
        initPoint: string;
    }>;
    private verifyMPSignature;
    handleMercadoPagoWebhook(body: Record<string, unknown>, query: Record<string, string>, xSignature?: string, xRequestId?: string): Promise<void>;
    private mapMPStatus;
}
