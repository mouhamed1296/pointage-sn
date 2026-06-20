import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import {
  DeviceAttendanceDto,
  ManualAttendanceDto,
  RecognizeDto,
  WebIdentifierDto,
} from './dto/attendance.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DeviceAuthGuard } from '../devices/device-auth.guard';
import { CurrentDevice } from '../devices/current-device.decorator';
import { Device } from '../devices/device.entity';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  /** Pointage émis par une borne ESP32 (badge / empreinte / code). */
  @UseGuards(DeviceAuthGuard)
  @Post('device')
  fromDevice(
    @CurrentDevice() device: Device,
    @Body() dto: DeviceAttendanceDto,
  ) {
    return this.service.recordFromDevice(device, dto);
  }

  /** Pointage par reconnaissance faciale (borne web). */
  @UseGuards(JwtAuthGuard)
  @Post('recognize')
  recognize(@Body() dto: RecognizeDto) {
    return this.service.recognize(dto);
  }

  /** Pointage badge / code saisi depuis la borne web (opérateur). */
  @UseGuards(JwtAuthGuard)
  @Post('by-identifier')
  byIdentifier(@Body() body: WebIdentifierDto) {
    return this.service.recordByIdentifier(body.moduleId, body);
  }

  /** Pointage manuel. */
  @UseGuards(JwtAuthGuard)
  @Post('manual')
  manual(@Body() dto: ManualAttendanceDto) {
    return this.service.manual(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  list(
    @Query('moduleId') moduleId?: string,
    @Query('personId') personId?: string,
    @Query('date') date?: string,
  ) {
    return this.service.list({ moduleId, personId, date });
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats')
  stats(@Query('moduleId') moduleId?: string) {
    return this.service.stats(moduleId);
  }
}
