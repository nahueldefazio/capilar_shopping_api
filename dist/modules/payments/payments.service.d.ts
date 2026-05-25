import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { OrdersService } from '../orders/orders.service';
export declare class PaymentsService {
    private readonly paymentRepo;
    private readonly ordersService;
    private readonly logger;
    constructor(paymentRepo: Repository<Payment>, ordersService: OrdersService);
    createMercadoPagoPreference(orderId: number): Promise<{
        preferenceId: string;
        initPoint: string;
    }>;
    handleMercadoPagoWebhook(payload: Record<string, unknown>): Promise<void>;
}
