import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';
import { User } from '../../users/entities/user.entity';

export type PaymentProvider = 'mock' | 'cib_satim' | 'edahabia' | 'cash_on_pickup';
export type PaymentStatus = 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded' | 'partially_refunded';
export type PaymentPurpose = 'rental' | 'deposit' | 'protection' | 'payout' | 'refund';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Booking, { nullable: true })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ default: 'mock' })
  provider: PaymentProvider;

  @Column()
  purpose: PaymentPurpose;

  @Column({ type: 'numeric' })
  amount: string;

  @Column({ default: 'DZD' })
  currency: string;

  @Column({ default: 'pending' })
  status: PaymentStatus;

  @Column({ name: 'provider_reference', nullable: true })
  providerReference: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
