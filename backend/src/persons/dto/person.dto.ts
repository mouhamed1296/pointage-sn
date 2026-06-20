import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';

export class CreatePersonDto {
  @IsUUID()
  moduleId: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsOptional()
  @IsString()
  externalId?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  /** Descripteur facial de 128 flottants (face-api.js). Méthode FACE. */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(128)
  @ArrayMaxSize(128)
  @IsNumber({}, { each: true })
  faceDescriptor?: number[];

  /** UID du badge RFID/NFC. Méthode BADGE. */
  @IsOptional()
  @IsString()
  badgeId?: string;

  /** Code PIN en clair (sera haché). Méthode CODE. */
  @IsOptional()
  @IsString()
  @Length(4, 12)
  pinCode?: string;

  /** Index du gabarit d'empreinte sur le capteur. Méthode FINGERPRINT. */
  @IsOptional()
  @IsInt()
  fingerprintId?: number;
}

export class UpdatePersonDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  externalId?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(128)
  @ArrayMaxSize(128)
  @IsNumber({}, { each: true })
  faceDescriptor?: number[];

  @IsOptional()
  @IsString()
  badgeId?: string;

  @IsOptional()
  @IsString()
  @Length(4, 12)
  pinCode?: string;

  @IsOptional()
  @IsInt()
  fingerprintId?: number;
}
