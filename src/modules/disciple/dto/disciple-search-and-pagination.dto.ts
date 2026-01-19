import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

import { BaseSearchAndPaginationDto } from '@/common/dtos/base-search-and-pagination.dto';

import { DiscipleSearchType } from '@/modules/disciple/enums/disciple-search-type.enum';
import { DiscipleSearchSubType } from '@/modules/disciple/enums/disciple-search-sub-type.enum';

export class DiscipleSearchOptionsDto {
  @ApiProperty({
    name: 'searchType',
    enum: DiscipleSearchType,
    description: 'Choose one of the types to perform a search.',
    example: DiscipleSearchType.FirstNames,
  })
  @IsEnum(DiscipleSearchType)
  @IsNotEmpty()
  searchType: DiscipleSearchType;

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
