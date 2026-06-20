import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TrackingModulesModule } from './tracking-modules/tracking-modules.module';
import { PersonsModule } from './persons/persons.module';
import { AttendanceModule } from './attendance/attendance.module';
import { RealtimeModule } from './realtime/realtime.module';
import { User } from './users/user.entity';
import { TrackingModule } from './tracking-modules/tracking-module.entity';
import { Person } from './persons/person.entity';
import { Attendance } from './attendance/attendance.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'better-sqlite3',
        database: config.get<string>('DB_PATH', 'pointage.sqlite'),
        entities: [User, TrackingModule, Person, Attendance],
        synchronize: true, // OK pour un MVP ; utiliser des migrations en prod
      }),
    }),
    AuthModule,
    UsersModule,
    TrackingModulesModule,
    PersonsModule,
    AttendanceModule,
    RealtimeModule,
  ],
  providers: [SeedService],
})
export class AppModule {}
