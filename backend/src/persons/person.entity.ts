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
   * reconnaissance faciale (méthode FACE).
   */
  @Column({ type: 'simple-json', nullable: true })
  faceDescriptor: number[] | null;

  /** Identifiant du badge RFID/NFC (UID lu par le lecteur). Méthode BADGE. */
  @Index()
  @Column({ nullable: true })
  badgeId: string;

  /**
   * Empreinte du code PIN (hash bcrypt). Méthode CODE.
   * Le code en clair n'est jamais stocké.
   */
  @Column({ type: 'varchar', nullable: true, select: false })
  pinCodeHash: string | null;

  /**
   * Identifiant numérique du gabarit d'empreinte stocké sur le capteur AS608.
   * Méthode FINGERPRINT. Unique au sein d'un module.
   */
  @Index()
  @Column({ type: 'int', nullable: true })
  fingerprintId: number | null;

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
