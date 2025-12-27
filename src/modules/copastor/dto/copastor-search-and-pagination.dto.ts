import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

import { BaseSearchAndPaginationDto } from '@/common/dtos/base-search-and-pagination.dto';

import { CopastorSearchType } from '@/modules/copastor/enums/copastor-search-type.enum';
import { CopastorSearchSubType } from '@/modules/copastor/enums/copastor-search-sub-type.enum';

export class CoPastorSearchOptionsDto {
  @ApiProperty({
    name: 'searchType',
    enum: CopastorSearchType,
    description: 'Choose one of the types to perform a search.',
    example: CopastorSearchType.FirstNames,
  })
  @IsEnum(CopastorSearchType)
  @IsNotEmpty()
  searchType: CopastorSearchType;

  @ApiProperty({
    name: 'searchSubType',
    enum: CopastorSearchSubType,
    description: 'Choose one of the types to perform a search.',
    example: CopastorSearchSubType.CopastorByPastorFirstNames,
  })
  @IsEnum(CopastorSearchSubType)
  @IsOptional()
  searchSubType: CopastorSearchSubType;
}

export class CoPastorSearchAndPaginationDto extends IntersectionType(
  CoPastorSearchOptionsDto,
  BaseSearchAndPaginationDto,
) {}
