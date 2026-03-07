import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

import { BaseSearchAndPaginationDto } from '@/common/dtos/base-search-and-pagination.dto';
import { MemberSearchType } from '@/common/enums/member-search-type.enum';

import { FamilyGroupSearchSubType } from '@/modules/family-group/enums/family-group-search-sub-type.enum';

export class FamilyGroupSearchOptionsDto {
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
