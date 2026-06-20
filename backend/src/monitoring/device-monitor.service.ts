import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { DevicesService } from '../devices/devices.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

/**
 * Supervision 24h/24 des bornes : vérifie périodiquement les heartbeats et
 * diffuse l'état (en ligne / hors ligne) aux tableaux de bord. Émet une alerte
 * à chaque changement d'état d'une borne.
 */
@Injectable()
export class DeviceMonitorService {
  private readonly logger = new Logger(DeviceMonitorService.name);
  private lastStatus = new Map<string, boolean>();

  constructor(
    private readonly devicesService: DevicesService,
    private readonly realtime: RealtimeGateway,
  ) {}

  @Interval(30_000)
  async checkDevices() {
    const devices = await this.devicesService.findAllRaw();
    const summary = devices.map((d) => {
      const online = this.devicesService.isOnline(d);
      const previous = this.lastStatus.get(d.id);

      if (previous !== undefined && previous !== online) {
        const message = online
          ? `Borne « ${d.name} » de nouveau en ligne`
          : `⚠️ Borne « ${d.name} » hors ligne`;
        this.logger.warn(message);
        this.realtime.emitDeviceAlert({
          deviceId: d.id,
          name: d.name,
          online,
          message,
          at: new Date().toISOString(),
        });
      }
      this.lastStatus.set(d.id, online);

      return {
        id: d.id,
        name: d.name,
        location: d.location,
        moduleId: d.moduleId,
        online,
        lastSeenAt: d.lastSeenAt,
      };
    });

    this.realtime.emitDeviceStatus(summary);
  }
}
