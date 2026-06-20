import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PointageMethod } from '../common/enums';
import { TrackingModule } from '../tracking-modules/tracking-module.entity';

/**
 * Une borne physique de pointage (typiquement un ESP32 + capteurs).
 * Chaque borne est rattachée à un module et s'authentifie auprès de l'API
 * avec une clé secrète. Son heartbeat permet la supervision 24h/24.
 */
@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  location: string;

  /** Hash de la clé API. La clé en clair n'est montrée qu'à la création. */
  @Column({ select: false })
  apiKeyHash: string;

  /** Méthodes prises en charge par cette borne. */
  @Column({ type: 'simple-json', nullable: true })
  methods: PointageMethod[] | null;

  @Index()
  @Column()
  moduleId: string;

  @ManyToOne(() => TrackingModule, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'moduleId' })
  module: TrackingModule;

  /**
   * Dernier heartbeat reçu (ISO 8601) — sert à déterminer si la borne est en
   * ligne. Stocké en chaîne pour rester compatible SQLite et PostgreSQL.
   */
  @Column({ type: 'varchar', nullable: true })
  lastSeenAt: string | null;

  @Column({ nullable: true })
  firmwareVersion: string;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
