import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Camera } from './camera.entity';
import { CamerasService } from './cameras.service';
import { CamerasController } from './cameras.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Camera])],
  providers: [CamerasService],
  controllers: [CamerasController],
  exports: [CamerasService],
})
export class CamerasModule {}
