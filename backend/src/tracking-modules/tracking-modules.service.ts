import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrackingModule } from './tracking-module.entity';
import {
  CreateTrackingModuleDto,
  UpdateTrackingModuleDto,
} from './dto/tracking-module.dto';

const DEFAULT_CONFIG = {
  faceMatchThreshold: 0.55,
  lateAfterMinutes: 0,
  requireCheckout: true,
};

@Injectable()
export class TrackingModulesService {
  constructor(
    @InjectRepository(TrackingModule)
    private readonly repo: Repository<TrackingModule>,
  ) {}

  findAll(): Promise<TrackingModule[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<TrackingModule> {
    const module = await this.repo.findOne({ where: { id } });
    if (!module) {
      throw new NotFoundException('Module introuvable');
    }
    return module;
  }

  create(dto: CreateTrackingModuleDto): Promise<TrackingModule> {
    const module = this.repo.create({
      ...dto,
      config: { ...DEFAULT_CONFIG, ...(dto.config ?? {}) },
    });
    return this.repo.save(module);
  }

  async update(
    id: string,
    dto: UpdateTrackingModuleDto,
  ): Promise<TrackingModule> {
    const module = await this.findOne(id);
    Object.assign(module, {
      ...dto,
      config: dto.config
        ? { ...(module.config ?? {}), ...dto.config }
        : module.config,
    });
    return this.repo.save(module);
  }

  async remove(id: string): Promise<void> {
    const module = await this.findOne(id);
    await this.repo.remove(module);
  }
}
