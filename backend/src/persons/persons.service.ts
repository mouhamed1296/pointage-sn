import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Person } from './person.entity';
import { CreatePersonDto, UpdatePersonDto } from './dto/person.dto';

@Injectable()
export class PersonsService {
  constructor(
    @InjectRepository(Person)
    private readonly repo: Repository<Person>,
  ) {}

  findByModule(moduleId: string): Promise<Person[]> {
    return this.repo.find({
      where: { moduleId },
      order: { fullName: 'ASC' },
    });
  }

  /** Personnes actives d'un module (pour la reconnaissance faciale). */
  findEnrolledByModule(moduleId: string): Promise<Person[]> {
    return this.repo.find({ where: { moduleId, active: true } });
  }

  async findOne(id: string): Promise<Person> {
    const person = await this.repo.findOne({ where: { id } });
    if (!person) {
      throw new NotFoundException('Personne introuvable');
    }
    return person;
  }

  /** Recherche par UID de badge dans un module (méthode BADGE). */
  findByBadge(moduleId: string, badgeId: string): Promise<Person | null> {
    return this.repo.findOne({
      where: { moduleId, badgeId, active: true },
    });
  }

  /** Recherche par index d'empreinte dans un module (méthode FINGERPRINT). */
  findByFingerprint(
    moduleId: string,
    fingerprintId: number,
  ): Promise<Person | null> {
    return this.repo.findOne({
      where: { moduleId, fingerprintId, active: true },
    });
  }

  /**
   * Recherche par code PIN dans un module (méthode CODE).
   * Les codes étant hachés, on compare le code fourni à chaque empreinte.
   */
  async findByPinCode(
    moduleId: string,
    pinCode: string,
  ): Promise<Person | null> {
    const candidates = await this.repo
      .createQueryBuilder('p')
      .addSelect('p.pinCodeHash')
      .where('p.moduleId = :moduleId', { moduleId })
      .andWhere('p.active = :active', { active: true })
      .andWhere('p.pinCodeHash IS NOT NULL')
      .getMany();

    for (const person of candidates) {
      if (person.pinCodeHash && (await bcrypt.compare(pinCode, person.pinCodeHash))) {
        return person;
      }
    }
    return null;
  }

  async create(dto: CreatePersonDto): Promise<Person> {
    const { pinCode, ...rest } = dto;
    const person = this.repo.create(rest);
    if (pinCode) {
      person.pinCodeHash = await bcrypt.hash(pinCode, 10);
    }
    return this.repo.save(person);
  }

  async update(id: string, dto: UpdatePersonDto): Promise<Person> {
    const person = await this.findOne(id);
    const { pinCode, ...rest } = dto;
    Object.assign(person, rest);
    if (pinCode) {
      person.pinCodeHash = await bcrypt.hash(pinCode, 10);
    }
    return this.repo.save(person);
  }

  async remove(id: string): Promise<void> {
    const person = await this.findOne(id);
    await this.repo.remove(person);
  }
}
