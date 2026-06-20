import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './user.entity';
import { UserRole } from '../common/enums';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repo: Repository<User>,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  /** Récupère un utilisateur avec son hash de mot de passe (pour le login). */
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }

  count(): Promise<number> {
    return this.repo.count();
  }

  async create(data: {
    email: string;
    name: string;
    password: string;
    role?: UserRole;
  }): Promise<User> {
    const existing = await this.repo.findOne({ where: { email: data.email } });
    if (existing) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }
    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = this.repo.create({
      email: data.email,
      name: data.name,
      passwordHash,
      role: data.role ?? UserRole.OPERATOR,
    });
    return this.repo.save(user);
  }
}
