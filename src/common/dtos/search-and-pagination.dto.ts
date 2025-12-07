import { ApiProperty } from '@nestjs/swagger';

import { Transform, Type } from 'class-transformer';
import {
  Min,
  IsEnum,
  IsString,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

import { SearchType } from '@/common/enums/search-types.enum';
import { SearchSubType } from '@/common/enums/search-sub-type.enum';

export class SearchAndPaginationDto {
  @ApiProperty({
    example: 'john.doe',
    description: 'The term to search for.',
  })
  @IsOptional()
  term?: string;

  @ApiProperty({
    name: 'searchType',
    enum: SearchType,
    description: 'Choose one of the types to perform a search.',
    example: SearchType.FirstNames,
  })
  @IsEnum(SearchType)
  @IsNotEmpty({ message: 'El tipo de búsqueda es requerido.' })
  @IsString()
  @IsOptional()
  searchType?: string;

  @ApiProperty({
    name: 'searchType',
    enum: SearchSubType,
    description: 'Choose one of the sub types to perform a search.',
    example: SearchSubType.ByDiscipleFirstNames,
  })
  @IsEnum(SearchSubType)
  @IsOptional()
  @IsString()
  searchSubType?: string;

  @ApiProperty({
    default: 10,
    example: 10,
    description: 'How many rows do you need?',
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiProperty({
    default: 0,
    example: 0,
    required: false,
    description: 'How many rows do you want to skip?',
  })
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  offset?: number;

  @ApiProperty({
    default: 'DESC',
    example: 'DESC',
    required: false,
    description: 'What type of order do you need the records in?',
  })
  @IsOptional()
  @IsString()
  @Type(() => String)
  order?: string;

  // * used for search all by churchId (review modules)
  @IsOptional()
  @IsString()
  @Type(() => String)
  churchId?: string;

  //* For preacher module when search by zone id and return preacher with family groups or not
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  isNullFamilyGroup?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  isNullZone?: boolean;

  //* For Zones and Family groups in metrics
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  allZones?: boolean;

  //* For Family groups in metrics
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  allFamilyGroups?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  allDistricts?: boolean;

  //* For Offerings (income and expenses) and Metrics
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  isSingleMonth?: boolean;
}
