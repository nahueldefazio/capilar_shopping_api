import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { ShippingStatus } from '../../../common/enums/shipping-status.enum';

@Entity('order_shipping')
export class OrderShipping {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Order, (order) => order.shipping, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column()
  orderId: number;

  @Column({ type: 'enum', enum: ShippingStatus, default: ShippingStatus.PENDING })
  status: ShippingStatus;

  @Column({ length: 100 })
  province: string;

  @Column({ length: 100 })
  city: string;

  @Column({ length: 20 })
  postalCode: string;

  @Column({ length: 200 })
  street: string;

  @Column({ length: 20 })
  streetNumber: string;

  @Column({ length: 50, nullable: true })
  apartment: string;

  @Column({ length: 80, nullable: true })
  trackingNumber: string;

  @Column({ length: 500, nullable: true })
  trackingUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
