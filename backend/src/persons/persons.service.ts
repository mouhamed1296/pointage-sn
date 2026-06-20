import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  /** Personnes d'un module disposant d'un descripteur facial enrôlé. */
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

  create(dto: CreatePersonDto): Promise<Person> {
    const person = this.repo.create(dto);
    return this.repo.save(person);
  }

  async update(id: string, dto: UpdatePersonDto): Promise<Person> {
    const person = await this.findOne(id);
    Object.assign(person, dto);
    return this.repo.save(person);
  }

  async remove(id: string): Promise<void> {
    const person = await this.findOne(id);
    await this.repo.remove(person);
  }
}
