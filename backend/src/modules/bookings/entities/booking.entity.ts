import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Vehicle } from '../../vehicles/entities/vehicle.entity';
import { User } from '../../users/entities/user.entity';

export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'ongoing'
  | 'completed'
  | 'cancelled_by_renter'
  | 'cancelled_by_owner'
  | 'rejected'
  | 'disputed';

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => Vehicle)
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @Index()
  @ManyToOne(() => User)
  @JoinColumn({ name: 'renter_id' })
  renter: User;

  @Index()
  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ name: 'start_at', type: 'timestamptz' })
  startAt: Date;

  @Column({ name: 'end_at', type: 'timestamptz' })
  endAt: Date;

  @Column({ default: 'pending' })
  status: BookingStatus;

  @Column({ name: 'price_per_day', type: 'numeric' })
  pricePerDay: string;

  @Column({ name: 'days_count' })
  daysCount: number;

  @Column({ type: 'numeric' })
  subtotal: string;

  @Column({ name: 'service_fee', type: 'numeric', default: 0 })
  serviceFee: string;

  @Column({ name: 'protection_fee', type: 'numeric', default: 0 })
  protectionFee: string;

  @Column({ name: 'deposit_amount', type: 'numeric', default: 0 })
  depositAmount: string;

  @Column({ name: 'total_amount', type: 'numeric' })
  totalAmount: string;

  @Column({ name: 'cancellation_reason', type: 'text', nullable: true })
  cancellationReason: string | null;

  @Column({ name: 'cancelled_at', type: 'timestamptz', nullable: true })
  cancelledAt: Date | null;

  @Column({ name: 'confirmed_at', type: 'timestamptz', nullable: true })
  confirmedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
