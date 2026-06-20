import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CameraStreamType } from '../common/enums';
import { TrackingModule } from '../tracking-modules/tracking-module.entity';

/**
 * Caméra IP visualisable en temps réel dans l'application. Peut être rattachée
 * à un module pour servir de source au pointage par reconnaissance faciale.
 */
@Entity('cameras')
export class Camera {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  location: string;

  /** URL du flux (MJPEG http://…/stream, HLS http://…/index.m3u8, …). */
  @Column()
  streamUrl: string;

  @Column({ type: 'varchar', default: CameraStreamType.MJPEG })
  streamType: CameraStreamType;

  /** Si vrai, la caméra peut être utilisée comme source de pointage FaceID. */
  @Column({ default: false })
  faceRecognition: boolean;

  @Index()
  @Column({ type: 'varchar', nullable: true })
  moduleId: string | null;

  @ManyToOne(() => TrackingModule, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'moduleId' })
  module: TrackingModule | null;

  @Column({ default: true })
  active: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
