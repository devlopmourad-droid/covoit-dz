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
import { Exclude } from 'class-transformer';
import { Commune } from '../../geography/entities/commune.entity';

export type UserRole = 'renter' | 'owner' | 'admin' | 'support';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  email: string;

  @Column({ nullable: true, unique: true })
  phone: string;

  // JAMAIS exposé dans les réponses API : ce champ a fuité une fois lors des
  // tests (renvoyé tel quel via une relation "owner" imbriquée) avant qu'on
  // n'active le ClassSerializerInterceptor global — d'où ce garde-fou au
  // niveau de l'entité elle-même plutôt que de compter sur chaque endpoint
  // pour explicitement l'omettre.
  @Exclude()
  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name' })
  lastName: string;

  // Le type doit être déclaré comme 'enum' (et pas simplement 'text') pour
  // que TypeORM applique sa logique de désérialisation des tableaux
  // d'énumérations Postgres ; sinon le driver renvoie la représentation
  // texte brute "{owner}" au lieu d'un vrai tableau JS ["owner"].
  @Column({
    type: 'enum',
    enum: ['renter', 'owner', 'admin', 'support'],
    enumName: 'user_role',
    array: true,
    default: () => "'{renter}'",
  })
  roles: UserRole[];

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth: string | null;

  @ManyToOne(() => Commune, { nullable: true })
  @JoinColumn({ name: 'commune_id' })
  commune: Commune | null;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ name: 'identity_verification_status', default: 'unverified' })
  identityVerificationStatus: VerificationStatus;

  @Column({ name: 'license_verification_status', default: 'unverified' })
  licenseVerificationStatus: VerificationStatus;

  @Column({ name: 'rating_avg', type: 'numeric', default: 0 })
  ratingAvg: string;

  @Column({ name: 'rating_count', default: 0 })
  ratingCount: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Exclude()
  @Column({ name: 'failed_login_attempts', default: 0 })
  failedLoginAttempts: number;

  @Exclude()
  @Column({ name: 'locked_until', type: 'timestamptz', nullable: true })
  lockedUntil: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
