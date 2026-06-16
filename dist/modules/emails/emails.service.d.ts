import { Order } from '../orders/entities/order.entity';
interface LegalRequestEmail {
    type: 'arrepentimiento';
    code: string;
    fullName: string;
    email: string;
    phone?: string;
    orderNumber?: string;
    message?: string;
}
export declare class EmailsService {
    private readonly logger;
    private readonly transporter;
    private readonly from;
    private warnedDisabled;
    constructor();
    sendOrderCreated(order: Order): Promise<void>;
    sendShippingUpdated(order: Order): Promise<void>;
    sendLegalRequest(request: LegalRequestEmail): Promise<void>;
    private send;
    private sendAdmin;
    private orderHtml;
    private wrapHtml;
    private money;
    private escape;
    private toText;
}
export {};
