import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserRole } from '../common/enums';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ select: false })
  passwordHash: string;

  @Column({ type: 'varchar', default: UserRole.OPERATOR })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;
}
