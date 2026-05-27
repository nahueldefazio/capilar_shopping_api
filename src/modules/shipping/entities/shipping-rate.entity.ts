import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ShippingZone } from '../../../common/enums/shipping-zone.enum';

@Entity('shipping_rates')
export class ShippingRate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: ShippingZone })
  zone: ShippingZone;

  @Column()
  minWeightGrams: number;

  @Column()
  maxWeightGrams: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
