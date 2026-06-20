import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { ManualAttendanceDto, RecognizeDto } from './dto/attendance.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  /** Pointage par reconnaissance faciale. */
  @Post('recognize')
  recognize(@Body() dto: RecognizeDto) {
    return this.service.recognize(dto);
  }

  /** Pointage manuel. */
  @Post('manual')
  manual(@Body() dto: ManualAttendanceDto) {
    return this.service.manual(dto);
  }

  @Get()
  list(
    @Query('moduleId') moduleId?: string,
    @Query('personId') personId?: string,
    @Query('date') date?: string,
  ) {
    return this.service.list({ moduleId, personId, date });
  }

  @Get('stats')
  stats(@Query('moduleId') moduleId?: string) {
    return this.service.stats(moduleId);
  }
}
