import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

import { BaseSearchAndPaginationDto } from '@/common/dtos/base-search-and-pagination.dto';

import { ZoneSearchType } from '@/modules/zone/enums/zone-search-type.enum';
import { ZoneSearchSubType } from '@/modules/zone/enums/zone-search-sub-type.enum';

export class ZoneSearchOptionsDto {
  @ApiProperty({
    name: 'searchType',
    enum: ZoneSearchType,
    description: 'Choose one of the types to perform a search.',
    example: ZoneSearchType.FirstNames,
  })
  @IsEnum(ZoneSearchType)
  @IsNotEmpty()
  searchType: ZoneSearchType;

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
