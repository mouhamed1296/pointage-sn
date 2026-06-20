import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ModuleType } from '../common/enums';
import { Person } from '../persons/person.entity';

/**
 * Configuration d'un module de pointage. C'est l'élément qui rend le système
 * « polyvalent et programmable » : chaque module définit son type, ses horaires
 * et ses règles.
 */
export interface ModuleConfig {
  /** Heure théorique d'arrivée (format "HH:mm"), ex: "08:00". */
  startTime?: string;
  /** Tolérance en minutes avant de marquer un retard. */
  lateAfterMinutes?: number;
  /** Heure théorique de départ (format "HH:mm"), ex: "17:00". */
  endTime?: string;
  /** Exiger un pointage de sortie en plus de l'entrée. */
  requireCheckout?: boolean;
  /** Seuil de distance euclidienne pour valider une correspondance faciale. */
  faceMatchThreshold?: number;
}

@Entity('tracking_modules')
export class TrackingModule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', default: ModuleType.EMPLOYEE })
  type: ModuleType;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'simple-json', nullable: true })
  config: ModuleConfig | null;

  @Column({ default: true })
  active: boolean;

  @OneToMany(() => Person, (person) => person.module)
  persons: Person[];

  @CreateDateColumn()
  createdAt: Date;
}
