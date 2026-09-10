import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Vehicle } from './vehicle.entity';

@Entity('vehicle_photos')
export class VehiclePhoto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Vehicle)
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @Column() url: string;

  @Column({ default: 0 }) position: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
