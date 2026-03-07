import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

import { BaseSearchAndPaginationDto } from '@/common/dtos/base-search-and-pagination.dto';
import { MemberSearchType } from '@/common/enums/member-search-type.enum';

import { MinistrySearchSubType } from '@/modules/ministry/enums/ministry-search-sub-type.enum';

export class MinistrySearchOptionsDto {
  @ApiProperty({
    name: 'searchType',
    enum: MemberSearchType,
    description: 'Choose one of the types to perform a search.',
    example: MemberSearchType.FirstNames,
  })
  @IsEnum(MemberSearchType)
  @IsNotEmpty()
  searchType: MemberSearchType;

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
