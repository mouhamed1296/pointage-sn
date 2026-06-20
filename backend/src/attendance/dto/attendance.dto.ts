import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { AttendanceDirection } from '../../common/enums';

/** Pointage par reconnaissance faciale : on envoie le descripteur capté. */
export class RecognizeDto {
  @IsUUID()
  moduleId: string;

  @IsArray()
  @ArrayMinSize(128)
  @ArrayMaxSize(128)
  @IsNumber({}, { each: true })
  descriptor: number[];

  @IsOptional()
  @IsEnum(AttendanceDirection)
  direction?: AttendanceDirection;
}

/** Pointage manuel : on désigne directement la personne. */
export class ManualAttendanceDto {
  @IsUUID()
  personId: string;

  @IsOptional()
  @IsEnum(AttendanceDirection)
  direction?: AttendanceDirection;
}
