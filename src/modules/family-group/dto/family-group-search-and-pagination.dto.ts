import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

import { BaseSearchAndPaginationDto } from '@/common/dtos/base-search-and-pagination.dto';

import { FamilyGroupSearchType } from '@/modules/family-group/enums/family-group-search-type.enum';
import { FamilyGroupSearchSubType } from '@/modules/family-group/enums/family-group-search-sub-type.enum';
import { Transform } from 'class-transformer';

export class FamilyGroupSearchOptionsDto {
  @ApiProperty({
    name: 'searchType',
    enum: FamilyGroupSearchType,
    description: 'Choose one of the types to perform a search.',
    example: FamilyGroupSearchType.FirstNames,
  })
  @IsEnum(FamilyGroupSearchType)
  @IsNotEmpty()
  searchType: FamilyGroupSearchType;

  @ApiProperty({
    name: 'searchSubType',
    enum: FamilyGroupSearchSubType,
    description: 'Choose one of the types to perform a search.',
    example: FamilyGroupSearchSubType.FamilyGroupByPreacherFirstNames,
  })
  @IsEnum(FamilyGroupSearchSubType)
  @IsOptional()
  searchSubType: FamilyGroupSearchSubType;

  @ApiProperty({
    name: 'withNullFamilyGroup',
    description:
      'Indicates whether null family group relationships should be included in the response.',
    example: 'true',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  withNullFamilyGroup?: boolean;
}

export class FamilyGroupSearchAndPaginationDto extends IntersectionType(
  FamilyGroupSearchOptionsDto,
  BaseSearchAndPaginationDto,
) {}
