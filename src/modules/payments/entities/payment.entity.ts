import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { PaymentProvider, PaymentStatus } from '../../../common/enums/payment.enum';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order, (order) => order.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column()
  orderId: number;

  @Column({ type: 'enum', enum: PaymentProvider, default: PaymentProvider.MANUAL })
  provider: PaymentProvider;

  // ID del pago en Mercado Pago o sistema externo
  @Column({ nullable: true, length: 100 })
  providerPaymentId: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  // Respuesta cruda del proveedor para auditoría
  @Column({ type: 'json', nullable: true })
  rawResponse: Record<string, unknown>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
