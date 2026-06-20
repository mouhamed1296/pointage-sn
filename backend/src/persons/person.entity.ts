import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TrackingModule } from '../tracking-modules/tracking-module.entity';

/**
 * Personne suivie par un module : salarié, étudiant ou participant.
 */
@Entity('persons')
export class Person {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  /** Identifiant métier : matricule, numéro étudiant, numéro de billet... */
  @Column({ nullable: true })
  externalId: string;

  @Column({ nullable: true })
  email: string;

  /**
   * Descripteur facial (vecteur de 128 flottants produit par face-api.js).
   * Stocké en JSON. C'est la donnée biométrique utilisée pour la
   * reconnaissance.
   */
  @Column({ type: 'simple-json', nullable: true })
  faceDescriptor: number[] | null;

  @Column({ default: true })
  active: boolean;

  @Index()
  @Column()
  moduleId: string;

  @ManyToOne(() => TrackingModule, (m) => m.persons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'moduleId' })
  module: TrackingModule;

  @CreateDateColumn()
  createdAt: Date;
}
