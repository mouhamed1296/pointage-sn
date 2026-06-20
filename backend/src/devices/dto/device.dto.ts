import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PointageMethod } from '../../common/enums';

export class CreateDeviceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUUID()
  moduleId: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(PointageMethod, { each: true })
  methods?: PointageMethod[];
}

export class UpdateDeviceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUUID()
  moduleId?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(PointageMethod, { each: true })
  methods?: PointageMethod[];

  @IsOptional()
  active?: boolean;
}

export class HeartbeatDto {
  @IsOptional()
  @IsString()
  firmwareVersion?: string;
}
