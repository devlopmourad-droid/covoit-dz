import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Booking } from './booking.entity';
import { User } from '../../users/entities/user.entity';

export type InspectionType = 'check_in' | 'check_out';

@Entity('vehicle_inspections')
export class VehicleInspection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Booking)
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;

  @Column() type: InspectionType;

  @Column({ nullable: true }) mileage: number;

  @Column({ name: 'fuel_level_percent', nullable: true })
  fuelLevelPercent: number;

  @Column({ name: 'exterior_notes', type: 'text', nullable: true })
  exteriorNotes: string;

  @Column({ name: 'interior_notes', type: 'text', nullable: true })
  interiorNotes: string;

  @Column({ name: 'damages_reported', default: false })
  damagesReported: boolean;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'performed_by' })
  performedBy: User;

  @CreateDateColumn({ name: 'performed_at' })
  performedAt: Date;
}
