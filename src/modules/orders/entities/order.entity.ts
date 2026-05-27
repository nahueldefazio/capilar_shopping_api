import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Customer } from '../../customers/entities/customer.entity';
import { OrderItem } from './order-item.entity';
import { OrderShipping } from './order-shipping.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { OrderStatus } from '../../../common/enums/order-status.enum';
import { PaymentMethod, PaymentStatus } from '../../../common/enums/payment.enum';
import { DeliveryMethod } from '../../../common/enums/delivery-method.enum';
import { ShippingZone } from '../../../common/enums/shipping-zone.enum';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 30, unique: true })
  orderNumber: string;

  @ManyToOne(() => Customer, (customer) => customer.orders, { eager: true, nullable: true })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @Column({ nullable: true })
  customerId: number;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true, eager: true })
  items: OrderItem[];

  @OneToMany(() => Payment, (payment) => payment.order, { cascade: true })
  payments: Payment[];

  @OneToOne(() => OrderShipping, (s) => s.order, { cascade: true, eager: true, nullable: true })
  shipping: OrderShipping;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  shippingCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total: number;

  @Column({ type: 'enum', enum: ShippingZone, nullable: true })
  shippingZone: ShippingZone | null;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.CREATED })
  status: OrderStatus;

  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.TRANSFER })
  paymentMethod: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Column({ type: 'enum', enum: DeliveryMethod, default: DeliveryMethod.HOME_DELIVERY })
  deliveryMethod: DeliveryMethod;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
