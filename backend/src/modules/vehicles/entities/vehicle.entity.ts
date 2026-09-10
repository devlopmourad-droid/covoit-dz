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
import { User } from '../../users/entities/user.entity';
import { Commune } from '../../geography/entities/commune.entity';

export type VehicleStatus = 'draft' | 'pending_review' | 'active' | 'paused' | 'suspended' | 'archived';
export type FuelType = 'essence' | 'diesel' | 'hybride' | 'electrique' | 'gpl';
export type TransmissionType = 'manuelle' | 'automatique';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => User)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column() brand: string;
  @Column() model: string;
  @Column() year: number;

  @Column({ name: 'license_plate', unique: true })
  licensePlate: string;

  @Column({ nullable: true }) color: string;
  @Column({ default: 5 }) seats: number;
  @Column({ nullable: true }) doors: number;

  @Column({ name: 'fuel_type' }) fuelType: FuelType;
  @Column() transmission: TransmissionType;

  @ManyToOne(() => Commune, { nullable: true })
  @JoinColumn({ name: 'commune_id' })
  commune: Commune | null;

  @Column({ name: 'address_label', nullable: true })
  addressLabel: string;

  @Column({ name: 'price_per_day', type: 'numeric' })
  pricePerDay: string;

  @Column({ name: 'deposit_amount', type: 'numeric', default: 0 })
  depositAmount: string;

  @Column({ name: 'min_rental_days', default: 1 })
  minRentalDays: number;

  @Column({ name: 'max_rental_days', default: 30 })
  maxRentalDays: number;

  @Column({ name: 'instant_booking', default: false })
  instantBooking: boolean;

  @Column({ name: 'mileage_limit_per_day', type: 'int', nullable: true })
  mileageLimitPerDay: number | null;

  @Column({ default: 'draft' })
  status: VehicleStatus;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', array: true, default: () => "'{}'" })
  features: string[];

  @Column({ name: 'avg_rating', type: 'numeric', default: 0 })
  avgRating: string;

  @Column({ name: 'rating_count', default: 0 })
  ratingCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
