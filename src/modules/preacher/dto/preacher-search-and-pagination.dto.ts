import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

import { BaseSearchAndPaginationDto } from '@/common/dtos/base-search-and-pagination.dto';
import { MemberSearchType } from '@/common/enums/member-search-type.enum';

import { PreacherSearchSubType } from '@/modules/preacher/enums/preacher-search-sub-type.enum';

export class PreacherSearchOptionsDto {
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
    enum: PreacherSearchSubType,
    description: 'Choose one of the types to perform a search.',
    example: PreacherSearchSubType.PreacherBySupervisorFirstNames,
  })
  @IsEnum(PreacherSearchSubType)
  @IsOptional()
  searchSubType: PreacherSearchSubType;

  @ApiProperty({
    name: 'withNullFamilyGroup',
    type: 'boolean',
    description:
      'Indicates whether null family group relationships should be included in the response',
    example: true,
    required: false,
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
