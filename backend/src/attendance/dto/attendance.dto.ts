import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { AttendanceDirection, PointageMethod } from '../../common/enums';

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

  /** Atteste qu'une preuve de vivacité (anti-spoofing) a été validée côté borne. */
  @IsOptional()
  @IsBoolean()
  liveness?: boolean;
}

/** Pointage manuel : on désigne directement la personne. */
export class ManualAttendanceDto {
  @IsUUID()
  personId: string;

  @IsOptional()
  @IsEnum(AttendanceDirection)
  direction?: AttendanceDirection;
}

/**
 * Pointage émis par une borne ESP32 authentifiée. Le module est déduit de la
 * borne ; on fournit la méthode et l'identifiant capté par le capteur.
 */
export class DeviceAttendanceDto {
  @IsEnum(PointageMethod)
  method: PointageMethod;

  /** UID du badge (BADGE) ou code PIN (CODE). */
  @IsOptional()
  @IsString()
  identifier?: string;

  /** Index du gabarit lu par le capteur d'empreinte (FINGERPRINT). */
  @IsOptional()
  @IsInt()
  fingerprintId?: number;

  @IsOptional()
  @IsEnum(AttendanceDirection)
  direction?: AttendanceDirection;
}

/** Variante web (opérateur) : le module est fourni explicitement. */
export class WebIdentifierDto extends DeviceAttendanceDto {
  @IsUUID()
  moduleId: string;
}
