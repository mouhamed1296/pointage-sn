import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from './device.entity';
import { DevicesService } from './devices.service';
import { DevicesController } from './devices.controller';
import { DeviceAuthGuard } from './device-auth.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Device])],
  providers: [DevicesService, DeviceAuthGuard],
  controllers: [DevicesController],
  exports: [DevicesService, DeviceAuthGuard],
})
export class DevicesModule {}
