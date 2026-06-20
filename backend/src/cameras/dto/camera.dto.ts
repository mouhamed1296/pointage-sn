import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { CameraStreamType } from '../../common/enums';

export class CreateCameraDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  streamUrl: string;

  @IsOptional()
  @IsEnum(CameraStreamType)
  streamType?: CameraStreamType;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsBoolean()
  faceRecognition?: boolean;

  @IsOptional()
  @IsUUID()
  moduleId?: string;
}

export class UpdateCameraDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  streamUrl?: string;

  @IsOptional()
  @IsEnum(CameraStreamType)
  streamType?: CameraStreamType;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsBoolean()
  faceRecognition?: boolean;

  @IsOptional()
  @IsUUID()
  moduleId?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
