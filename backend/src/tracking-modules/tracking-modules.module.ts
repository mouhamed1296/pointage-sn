import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrackingModule } from './tracking-module.entity';
import { TrackingModulesService } from './tracking-modules.service';
import { TrackingModulesController } from './tracking-modules.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TrackingModule])],
  providers: [TrackingModulesService],
  controllers: [TrackingModulesController],
  exports: [TrackingModulesService],
})
export class TrackingModulesModule {}
