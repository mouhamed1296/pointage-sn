import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { DevicesService } from './devices.service';
import { CreateDeviceDto, HeartbeatDto, UpdateDeviceDto } from './dto/device.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../common/enums';
import { DeviceAuthGuard } from './device-auth.guard';
import { CurrentDevice } from './current-device.decorator';
import { Device } from './device.entity';

@Controller('devices')
export class DevicesController {
  constructor(private readonly service: DevicesService) {}

  // --- Endpoint borne (authentification par clé API) ---

  /** Signal de vie envoyé périodiquement par la borne ESP32. */
  @UseGuards(DeviceAuthGuard)
  @Post('heartbeat')
  async heartbeat(
    @CurrentDevice() device: Device,
    @Body() dto: HeartbeatDto,
  ) {
    await this.service.heartbeat(device.id, dto.firmwareVersion);
    return { ok: true, serverTime: new Date().toISOString() };
  }

  // --- Endpoints back-office (authentification opérateur) ---

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() dto: CreateDeviceDto) {
    return this.service.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDeviceDto) {
    return this.service.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post(':id/regenerate-key')
  regenerate(@Param('id') id: string) {
    return this.service.regenerateKey(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
