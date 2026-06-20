import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from './attendance.entity';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { PersonsModule } from '../persons/persons.module';
import { TrackingModulesModule } from '../tracking-modules/tracking-modules.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { DevicesModule } from '../devices/devices.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attendance]),
    PersonsModule,
    TrackingModulesModule,
    RealtimeModule,
    DevicesModule,
  ],
  providers: [AttendanceService],
  controllers: [AttendanceController],
})
export class AttendanceModule {}
