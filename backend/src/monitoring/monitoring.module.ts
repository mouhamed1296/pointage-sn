import { Module } from '@nestjs/common';
import { DeviceMonitorService } from './device-monitor.service';
import { DevicesModule } from '../devices/devices.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [DevicesModule, RealtimeModule],
  providers: [DeviceMonitorService],
})
export class MonitoringModule {}
