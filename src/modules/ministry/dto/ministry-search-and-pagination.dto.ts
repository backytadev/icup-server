import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

import { BaseSearchAndPaginationDto } from '@/common/dtos/base-search-and-pagination.dto';

import { MinistrySearchType } from '@/modules/ministry/enums/ministry-search-type.enum';
import { MinistrySearchSubType } from '@/modules/ministry/enums/ministry-search-sub-type.enum';

export class MinistrySearchOptionsDto {
  @ApiProperty({
    name: 'searchType',
    enum: MinistrySearchType,
    description: 'Choose one of the types to perform a search.',
    example: MinistrySearchType.FirstNames,
  })
  @IsEnum(MinistrySearchType)
  @IsNotEmpty()
  searchType: MinistrySearchType;

  @ApiProperty({
    name: 'searchSubType',
    enum: MinistrySearchSubType,
    description: 'Choose one of the types to perform a search.',
    example: MinistrySearchSubType.MinistryByPastorFirstNames,
  })
  @IsEnum(MinistrySearchSubType)
  @IsOptional()
  searchSubType: MinistrySearchSubType;
}

export class MinistrySearchAndPaginationDto extends IntersectionType(
  MinistrySearchOptionsDto,
  BaseSearchAndPaginationDto,
) {}
