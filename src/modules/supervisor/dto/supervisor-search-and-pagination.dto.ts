import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

import { BaseSearchAndPaginationDto } from '@/common/dtos/base-search-and-pagination.dto';
import { MemberSearchType } from '@/common/enums/member-search-type.enum';
import { SupervisorSearchSubType } from '@/modules/supervisor/enums/supervisor-search-sub-type.enum';

export class SupervisorSearchOptionsDto {
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
