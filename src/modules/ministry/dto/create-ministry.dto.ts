import {
  IsEnum,
  IsEmail,
  IsArray,
  IsString,
  MaxLength,
  MinLength,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { RecordStatus } from '@/common/enums/record-status.enum';

import { MinistryInactivationReason } from '@/modules/ministry/enums/ministry-inactivation-reason.enum';
import { MinistryInactivationCategory } from '@/modules/ministry/enums/ministry-inactivation-category.enum';

export class CreateMinistryDto {
  //* General info
  @ApiProperty({
    example: 'kids_ministry',
  })
  @IsString()
  @IsNotEmpty()
  ministryType: string;

  @ApiProperty({
    example: 'Juventud en Marcha',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  customMinistryName: string;

  @ApiProperty({
    example: ['9:00', '16:00'],
  })
  @IsArray()
  @IsNotEmpty()
  serviceTimes: string[];

  @ApiProperty({
    example: '2020/10/25',
  })
  @IsString()
  @IsNotEmpty()
  foundingDate: Date;

  //* Contact Info
  @ApiProperty({
    example: 'culto.juvenil@icup.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: '+51 999-988-788',
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({
    example: 'Perú',
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(15)
  country?: string;

  @ApiProperty({
    example: 'Lima',
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(15)
  department?: string;

  @ApiProperty({
    example: 'Lima',
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(15)
  province?: string;

  @ApiProperty({
    example: 'Comas',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(20)
  district: string;

  @ApiProperty({
    example: 'La Merced',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(30)
  urbanSector: string;

  @ApiProperty({
    example: 'Av.Progreso 123',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(80)
  address: string;

  @ApiProperty({
    example: 'A una cuadra del hospital central.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(150)
  referenceAddress: string;

  //* Roles and Status
  @ApiProperty({
    example: 'active',
  })
  @IsString()
  @IsEnum(RecordStatus, {
    message:
      'El estado de registro debe ser uno de los siguientes valores: Activo o Inactivo.',
  })
  @IsOptional()
  recordStatus?: string;

  //* Relations
  @ApiProperty({
    example: 'cf5a9ee3-cad7-4b73-a331-a5f3f76f6661',
  })
  @IsString()
  @IsOptional()
  theirPastor?: string;

  @ApiProperty({
    example: 'cf5a9ee3-cad7-4b73-a331-a5f3f76f6661',
  })
  @IsString()
  @IsOptional()
  theirChurch?: string;

  //! Properties record inactivation (optional)
  @IsOptional()
  @IsEnum(MinistryInactivationCategory)
  ministryInactivationCategory?: string;

  @IsOptional()
  @IsEnum(MinistryInactivationReason)
  ministryInactivationReason?: string;
}
