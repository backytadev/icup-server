import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

import { BaseSearchAndPaginationDto } from '@/common/dtos/base-search-and-pagination.dto';

import { PreacherSearchType } from '@/modules/preacher/enums/preacher-search-type.enum';
import { PreacherSearchSubType } from '@/modules/preacher/enums/preacher-search-sub-type.enum';
import { Transform } from 'class-transformer';

export class PreacherSearchOptionsDto {
  @ApiProperty({
    name: 'searchType',
    enum: PreacherSearchType,
    description: 'Choose one of the types to perform a search.',
    example: PreacherSearchType.FirstNames,
  })
  @IsEnum(PreacherSearchType)
  @IsNotEmpty()
  searchType: PreacherSearchType;

  @ApiProperty({
    name: 'searchSubType',
    enum: PreacherSearchSubType,
    description: 'Choose one of the types to perform a search.',
    example: PreacherSearchSubType.PreacherBySupervisorFirstNames,
  })
  @IsEnum(PreacherSearchSubType)
  @IsOptional()
  searchSubType: PreacherSearchSubType;

  @ApiProperty({
    name: 'withNullFamilyGroup',
    enum: PreacherSearchSubType,
    description:
      'Indicates whether null family group relationships should be included in the response',
    example: true,
    required: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  withNullFamilyGroup?: boolean;
}

export class PreacherSearchAndPaginationDto extends IntersectionType(
  PreacherSearchOptionsDto,
  BaseSearchAndPaginationDto,
) {}
