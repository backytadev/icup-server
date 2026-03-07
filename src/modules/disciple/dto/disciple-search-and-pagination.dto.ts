import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

import { BaseSearchAndPaginationDto } from '@/common/dtos/base-search-and-pagination.dto';
import { MemberSearchType } from '@/common/enums/member-search-type.enum';

import { DiscipleSearchSubType } from '@/modules/disciple/enums/disciple-search-sub-type.enum';

export class DiscipleSearchOptionsDto {
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
    enum: DiscipleSearchSubType,
    description: 'Choose one of the types to perform a search.',
    example: DiscipleSearchSubType.DiscipleByPreacherFirstNames,
  })
  @IsEnum(DiscipleSearchSubType)
  @IsOptional()
  searchSubType: DiscipleSearchSubType;
}

export class DiscipleSearchAndPaginationDto extends IntersectionType(
  DiscipleSearchOptionsDto,
  BaseSearchAndPaginationDto,
) {}
