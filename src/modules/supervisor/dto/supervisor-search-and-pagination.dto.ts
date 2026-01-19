import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

import { BaseSearchAndPaginationDto } from '@/common/dtos/base-search-and-pagination.dto';
import { SupervisorSearchType } from '@/modules/supervisor/enums/supervisor-search-type.enum';
import { SupervisorSearchSubType } from '@/modules/supervisor/enums/supervisor-search-sub-type.num';

export class SupervisorSearchOptionsDto {
  @ApiProperty({
    name: 'searchType',
    enum: SupervisorSearchType,
    description: 'Choose one of the types to perform a search.',
    example: SupervisorSearchType.FirstNames,
  })
  @IsEnum(SupervisorSearchType)
  @IsNotEmpty()
  searchType: SupervisorSearchType;

  @ApiProperty({
    name: 'searchSubType',
    enum: SupervisorSearchSubType,
    description: 'Choose one of the types to perform a search.',
    example: SupervisorSearchSubType.SupervisorByCopastorFirstNames,
  })
  @IsEnum(SupervisorSearchSubType)
  @IsOptional()
  searchSubType: SupervisorSearchSubType;

  @ApiProperty({
    name: 'withNullZone',
    description:
      'Indicates whether null zone relationships should be included in the response',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  withNullZone?: boolean;
}

export class SupervisorSearchAndPaginationDto extends IntersectionType(
  SupervisorSearchOptionsDto,
  BaseSearchAndPaginationDto,
) {}
