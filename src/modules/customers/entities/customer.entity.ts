import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { SaleType } from '../../../common/enums/sale-type.enum';

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  fullName: string;

  @Column({ length: 200 })
  email: string;

  @Column({ length: 30, nullable: true })
  phone: string;

  @Column({ type: 'enum', enum: SaleType, default: SaleType.SALON })
  customerType: SaleType;

  @Column({ length: 300, nullable: true })
  address: string;

  @Column({ length: 100, nullable: true })
  province: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ length: 20, nullable: true })
  postalCode: string;

  @OneToMany(() => Order, (order) => order.customer)
  orders: Order[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
