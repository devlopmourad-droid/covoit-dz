import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Commune } from './commune.entity';

@Entity('wilayas')
export class Wilaya {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column({ name: 'name_fr' })
  nameFr: string;

  @Column({ name: 'name_ar' })
  nameAr: string;

  @OneToMany(() => Commune, (commune) => commune.wilaya)
  communes: Commune[];
}
