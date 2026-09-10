import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('protection_plans')
export class ProtectionPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true }) code: string;
  @Column({ name: 'name_fr' }) nameFr: string;
  @Column({ name: 'name_ar', nullable: true }) nameAr: string;

  @Column({ name: 'deductible_amount', type: 'numeric' })
  deductibleAmount: string;

  @Column({ name: 'daily_price', type: 'numeric' })
  dailyPrice: string;

  @Column({ name: 'coverage_description', type: 'text', nullable: true })
  coverageDescription: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'legal_status', default: 'pending_legal_validation' })
  legalStatus: string;
}
