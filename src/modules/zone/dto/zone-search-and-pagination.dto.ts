import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

import { BaseSearchAndPaginationDto } from '@/common/dtos/base-search-and-pagination.dto';
import { MemberSearchType } from '@/common/enums/member-search-type.enum';

import { ZoneSearchSubType } from '@/modules/zone/enums/zone-search-sub-type.enum';

export class ZoneSearchOptionsDto {
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
    enum: ZoneSearchSubType,
    description: 'Choose one of the types to perform a search.',
    example: ZoneSearchSubType.ZoneBySupervisorFirstNames,
  })
  @IsEnum(ZoneSearchSubType)
  @IsOptional()
  searchSubType: ZoneSearchSubType;
}

export class ZoneSearchAndPaginationDto extends IntersectionType(
  ZoneSearchOptionsDto,
  BaseSearchAndPaginationDto,
) {}
