import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import {
  AttendanceDirection,
  AttendanceStatus,
  PointageMethod,
} from '../common/enums';
import { Person } from '../persons/person.entity';
import { TrackingModule } from '../tracking-modules/tracking-module.entity';

/** Un enregistrement de pointage (entrée ou sortie). */
@Entity('attendances')
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  personId: string;

  @ManyToOne(() => Person, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'personId' })
  person: Person;

  @Index()
  @Column()
  moduleId: string;

  @ManyToOne(() => TrackingModule, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'moduleId' })
  module: TrackingModule;

  @Column({ type: 'varchar', default: AttendanceDirection.IN })
  direction: AttendanceDirection;

  @Column({ type: 'varchar', default: AttendanceStatus.PRESENT })
  status: AttendanceStatus;

  @Column({ type: 'varchar', default: PointageMethod.FACE })
  method: PointageMethod;

  /** Confiance de la reconnaissance (1 - distance euclidienne), entre 0 et 1. */
  @Column({ type: 'float', default: 1 })
  confidence: number;

  @Index()
  @CreateDateColumn()
  timestamp: Date;
}
