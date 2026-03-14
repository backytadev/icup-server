import {
  IsEnum,
  IsString,
  MinLength,
  MaxLength,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { OfferingIncomeCreationType } from '@/modules/offering/income/enums/offering-income-creation-type.enum';
import { OfferingIncomeCreationSubType } from '@/modules/offering/income/enums/offering-income-creation-sub-type.enum';

import { FileFolder } from '@/common/enums/file-folder.enum';

export class CreateFileDto {
  @ApiProperty({
    enum: FileFolder,
    example: FileFolder.Income,
    description: 'Type of file to be used for the image path.',
  })
  @IsEnum(FileFolder)
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(20)
  fileFolder: string;

  @ApiProperty({
    enum: OfferingIncomeCreationType,
    example: OfferingIncomeCreationType.Offering,
    required: false,
    description:
      'Type of offering to be used for the image path. Not required for calendar-events.',
  })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(40)
  offeringType?: string;

  @ApiProperty({
    enum: OfferingIncomeCreationSubType,
    example: OfferingIncomeCreationSubType.ChurchGround,
    required: false,
    description: 'Sub-type of offering to be used for the image path.',
  })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(40)
  offeringSubType?: string;
}
