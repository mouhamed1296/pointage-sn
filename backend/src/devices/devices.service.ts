import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { Device } from './device.entity';
import { CreateDeviceDto, UpdateDeviceDto } from './dto/device.dto';

/** Au-delà de ce délai sans heartbeat, une borne est considérée hors ligne. */
export const OFFLINE_THRESHOLD_MS = 90_000;

export interface DeviceView extends Omit<Device, 'apiKeyHash'> {
  online: boolean;
}

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private readonly repo: Repository<Device>,
  ) {}

  private generateApiKey(): string {
    return 'dev_' + randomBytes(24).toString('hex');
  }

  isOnline(device: Device): boolean {
    if (!device.lastSeenAt) return false;
    return (
      Date.now() - new Date(device.lastSeenAt).getTime() < OFFLINE_THRESHOLD_MS
    );
  }

  toView(device: Device): DeviceView {
    const { apiKeyHash, ...rest } = device as Device & { apiKeyHash?: string };
    return { ...(rest as Device), online: this.isOnline(device) } as DeviceView;
  }

  async findAll(): Promise<DeviceView[]> {
    const devices = await this.repo.find({ order: { createdAt: 'DESC' } });
    return devices.map((d) => this.toView(d));
  }

  async findOne(id: string): Promise<Device> {
    const device = await this.repo.findOne({ where: { id } });
    if (!device) {
      throw new NotFoundException('Borne introuvable');
    }
    return device;
  }

  /** Charge une borne avec son hash de clé (pour l'authentification). */
  findOneWithKey(id: string): Promise<Device | null> {
    return this.repo
      .createQueryBuilder('d')
      .addSelect('d.apiKeyHash')
      .where('d.id = :id', { id })
      .getOne();
  }

  /** Crée une borne et renvoie la clé API en clair (affichée une seule fois). */
  async create(
    dto: CreateDeviceDto,
  ): Promise<{ device: DeviceView; apiKey: string }> {
    const apiKey = this.generateApiKey();
    const device = this.repo.create({
      ...dto,
      apiKeyHash: await bcrypt.hash(apiKey, 10),
    });
    const saved = await this.repo.save(device);
    return { device: this.toView(saved), apiKey };
  }

  async update(id: string, dto: UpdateDeviceDto): Promise<DeviceView> {
    const device = await this.findOne(id);
    Object.assign(device, dto);
    const saved = await this.repo.save(device);
    return this.toView(saved);
  }

  /** Régénère la clé API d'une borne. */
  async regenerateKey(id: string): Promise<{ apiKey: string }> {
    const device = await this.findOne(id);
    const apiKey = this.generateApiKey();
    device.apiKeyHash = await bcrypt.hash(apiKey, 10);
    await this.repo.save(device);
    return { apiKey };
  }

  /** Valide les identifiants d'une borne (id + clé). */
  async authenticate(id: string, apiKey: string): Promise<Device | null> {
    const device = await this.findOneWithKey(id);
    if (!device || !device.active) return null;
    const ok = await bcrypt.compare(apiKey, device.apiKeyHash);
    return ok ? device : null;
  }

  async heartbeat(id: string, firmwareVersion?: string): Promise<void> {
    await this.repo.update(id, {
      lastSeenAt: new Date().toISOString(),
      ...(firmwareVersion ? { firmwareVersion } : {}),
    });
  }

  async remove(id: string): Promise<void> {
    const device = await this.findOne(id);
    await this.repo.remove(device);
  }

  findAllRaw(): Promise<Device[]> {
    return this.repo.find();
  }
}
