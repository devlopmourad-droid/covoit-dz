import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Wilaya } from './wilaya.entity';
import { Daira } from './daira.entity';

@Entity('communes')
export class Commune {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @ManyToOne(() => Wilaya, (wilaya) => wilaya.communes)
  @JoinColumn({ name: 'wilaya_id' })
  wilaya: Wilaya;

  @ManyToOne(() => Daira, { nullable: true })
  @JoinColumn({ name: 'daira_id' })
  daira: Daira | null;

  @Column({ name: 'postal_code', nullable: true })
  postalCode: string;

  @Column({ name: 'name_fr' })
  nameFr: string;

  @Column({ name: 'name_ar', nullable: true })
  nameAr: string;

  // Stocké en geography(Point,4326) côté SQL ; exposé en lat/lng via des
  // requêtes dédiées (voir GeographyService) plutôt que mappé nativement,
  // TypeORM n'ayant pas de support de première classe pour PostGIS.
}
