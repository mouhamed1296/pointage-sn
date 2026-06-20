import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TrackingModulesModule } from './tracking-modules/tracking-modules.module';
import { PersonsModule } from './persons/persons.module';
import { AttendanceModule } from './attendance/attendance.module';
import { RealtimeModule } from './realtime/realtime.module';
import { DevicesModule } from './devices/devices.module';
import { CamerasModule } from './cameras/cameras.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { HealthModule } from './health/health.module';
import { User } from './users/user.entity';
import { TrackingModule } from './tracking-modules/tracking-module.entity';
import { Person } from './persons/person.entity';
import { Attendance } from './attendance/attendance.entity';
import { Device } from './devices/device.entity';
import { Camera } from './cameras/camera.entity';
import { SeedService } from './seed.service';

const ENTITIES = [User, TrackingModule, Person, Attendance, Device, Camera];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => {
        // Choix de la base : SQLite par défaut (zéro config), PostgreSQL
        // recommandé en production pour un fonctionnement 24h/24.
        const dbType = config.get<string>('DB_TYPE', 'sqlite');
        if (dbType === 'postgres') {
          return {
            type: 'postgres',
            host: config.get<string>('DB_HOST', 'localhost'),
            port: config.get<number>('DB_PORT', 5432),
            username: config.get<string>('DB_USER', 'pointage'),
            password: config.get<string>('DB_PASSWORD', 'pointage'),
            database: config.get<string>('DB_NAME', 'pointage'),
            entities: ENTITIES,
            synchronize: true,
            autoLoadEntities: true,
          };
        }
        return {
          type: 'better-sqlite3',
          database: config.get<string>('DB_PATH', 'pointage.sqlite'),
          entities: ENTITIES,
          synchronize: true,
        };
      },
    }),
    AuthModule,
    UsersModule,
    TrackingModulesModule,
    PersonsModule,
    AttendanceModule,
    RealtimeModule,
    DevicesModule,
    CamerasModule,
    MonitoringModule,
    HealthModule,
  ],
  providers: [SeedService],
})
export class AppModule {}
