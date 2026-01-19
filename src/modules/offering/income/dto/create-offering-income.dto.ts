import {
  IsEnum,
  IsArray,
  IsEmail,
  IsString,
  IsBoolean,
  MaxLength,
  MinLength,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { CurrencyType } from '@/modules/offering/shared/enums/currency-type.enum';
import { OfferingInactivationReason } from '@/modules/offering/shared/enums/offering-inactivation-reason.enum';

import { Gender } from '@/common/enums/gender.enum';
import { RecordStatus } from '@/common/enums/record-status.enum';
import { MemberOfferingType } from '@/modules/offering/income/enums/member-offering-type.enum';

import { OfferingIncomeCreationType } from '@/modules/offering/income/enums/offering-income-creation-type.enum';
import { OfferingIncomeCreationSubType } from '@/modules/offering/income/enums/offering-income-creation-sub-type.enum';
import { OfferingIncomeCreationCategory } from '@/modules/offering/income/enums/offering-income-creation-category.enum';
import { OfferingIncomeCreationShiftType } from '@/modules/offering/income/enums/offering-income-creation-shift-type.enum';

export class CreateOfferingIncomeDto {
  //* General data
  @ApiProperty({
    example: OfferingIncomeCreationType.Offering,
  })
  @IsEnum(OfferingIncomeCreationType)
  type: OfferingIncomeCreationType;

  @ApiProperty({
    example: OfferingIncomeCreationSubType.ChurchGround,
  })
  @IsOptional()
  subType?: OfferingIncomeCreationSubType;

  @ApiProperty({
    example: OfferingIncomeCreationCategory.ExternalDonation,
  })
  @IsOptional()
  category?: OfferingIncomeCreationCategory;

  //? For new Donator
  @ApiProperty({
    example: true,
    description: 'Do you want create a new donor?',
  })
  @IsOptional()
  @IsBoolean()
  isNewExternalDonor?: boolean;

  @ApiProperty({
    example: '0b46eb7e-7730-4cbb-8c61-3ccdfa6da391',
  })
  @IsString()
  @IsOptional()
  externalDonorId?: string;

  @ApiProperty({
    example: 'John Martin',
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(50)
  externalDonorFirstNames?: string;

  @ApiProperty({
    example: 'Rojas Castro',
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(50)
  externalDonorLastNames?: string;

  @ApiProperty({
    example: Gender.Male,
  })
  @IsEnum(Gender, {
    message:
      'El género debe ser uno de los siguientes valores: Masculino o Femenino',
  })
  @IsOptional()
  externalDonorGender?: string;

  @ApiProperty({
    example: '1990-12-23',
  })
  @IsString()
  @IsOptional()
  externalDonorBirthDate?: Date;

  @ApiProperty({
    example: '+51 999333555',
  })
  @IsString()
  @IsOptional()
  externalDonorPhoneNumber?: string;

  @ApiProperty({
    example: 'example@example.com',
  })
  @IsEmail()
  @IsOptional()
  externalDonorEmail?: string;

  @ApiProperty({
    example: 'Perú',
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(40)
  externalDonorOriginCountry?: string;

  @ApiProperty({
    example: 'Italia',
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(40)
  externalDonorResidenceCountry?: string;

  @ApiProperty({
    example: 'Roma',
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(40)
  externalDonorResidenceCity?: string;

  @ApiProperty({
    example: 'A 2 cuadras al colegio',
  })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(40)
  externalDonorPostalCode?: string;

  //* ------------------------------------------------------------------ //

  @ApiProperty({
    example: OfferingIncomeCreationShiftType.Day,
  })
  @IsOptional()
  @IsString()
  shift?: OfferingIncomeCreationShiftType | string;

  @ApiProperty({
    example: '50',
  })
  @IsNotEmpty()
  amount: string | number;

  @ApiProperty({
    example: CurrencyType.PEN,
  })
  @IsEnum(CurrencyType)
  @IsNotEmpty()
  currency: CurrencyType;

  @ApiProperty({
    example: '1990/12/23',
  })
  @IsNotEmpty()
  date: Date;

  @ApiProperty({
    example: 'Example comments.....',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  comments?: string;

  @ApiProperty({
    example: [
      `https://res.cloudinary.com/example/image/upload/v111136172/income/offering/church_ground/nsdhjntwknysxkkn8zfu.png`,
      `https://res.cloudinary.com/example/image/upload/v111125736/income/offering/church_ground/nsdhjntwknysxkkn8zfu.png`,
    ],
  })
  @IsArray()
  @IsOptional()
  imageUrls?: string[];

  @ApiProperty({
    example: OfferingInactivationReason.TypeSelectionError,
  })
  @IsEnum(OfferingInactivationReason)
  @MinLength(1)
  @MaxLength(50)
  @IsOptional()
  reasonElimination?: OfferingInactivationReason;

  @ApiProperty({
    example: RecordStatus.Active,
  })
  @IsString()
  @IsEnum(RecordStatus, {
    message:
      'El estado de registro debe ser uno de los siguientes valores: Activo o Inactivo.',
  })
  @IsOptional()
  recordStatus?: string;

  @ApiProperty({
    example: MemberOfferingType.Pastor,
  })
  @IsOptional()
  @IsString()
  memberType?: string | undefined;

  //* Relations
  @ApiProperty({
    example: '0b46eb7e-7730-4cbb-8c61-3ccdfa6da391',
  })
  @IsString()
  @IsOptional()
  churchId?: string;

  @ApiProperty({
    example: '0b46eb7e-7730-4cbb-8c61-3ccdfa6da391',
  })
  @IsString()
  @IsOptional()
  familyGroupId?: string;

  @ApiProperty({
    example: '0b46eb7e-7730-4cbb-8c61-3ccdfa6da391',
  })
  @IsString()
  @IsOptional()
  memberId?: string;

  @ApiProperty({
    example: '0b46eb7e-7730-4cbb-8c61-3ccdfa6da391',
  })
  @IsString()
  @IsOptional()
  zoneId?: string;
}
