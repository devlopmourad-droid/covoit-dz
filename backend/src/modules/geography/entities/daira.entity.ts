import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Wilaya } from './wilaya.entity';

/**
 * Couche "daïra" : schéma prêt, données pas encore importées.
 * Voir docs/DATA_MODEL.md pour le détail de ce qui manque et pourquoi.
 */
@Entity('dairas')
export class Daira {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Wilaya)
  @JoinColumn({ name: 'wilaya_id' })
  wilaya: Wilaya;

  @Column({ nullable: true })
  code: string;

  @Column({ name: 'name_fr' })
  nameFr: string;

  @Column({ name: 'name_ar', nullable: true })
  nameAr: string;
}
