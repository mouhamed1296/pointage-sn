import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ModuleType } from '../../common/enums';

export class ModuleConfigDto {
  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  lateAfterMinutes?: number;

  @IsOptional()
  @IsBoolean()
  requireCheckout?: boolean;

  @IsOptional()
  faceMatchThreshold?: number;

  @IsOptional()
  @IsBoolean()
  requireLiveness?: boolean;
}

export class CreateTrackingModuleDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(ModuleType)
  type: ModuleType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ModuleConfigDto)
  config?: ModuleConfigDto;
}

export class UpdateTrackingModuleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(ModuleType)
  type?: ModuleType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => ModuleConfigDto)
  config?: ModuleConfigDto;
}
