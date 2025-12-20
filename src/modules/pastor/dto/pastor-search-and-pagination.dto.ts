import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

import { BaseSearchAndPaginationDto } from '@/common/dtos/base-search-and-pagination.dto';

import { PastorSearchType } from '@/modules/pastor/enums/pastor-search-type.enum';

export class PastorSearchOptionsDto {
  @ApiProperty({
    name: 'searchType',
    enum: PastorSearchType,
    description: 'Choose one of the types to perform a search.',
    example: PastorSearchType.FirstNames,
  })
  @IsEnum(PastorSearchType)
  @IsNotEmpty()
  searchType: PastorSearchType;
}

export class PastorSearchAndPaginationDto extends IntersectionType(
  PastorSearchOptionsDto,
  BaseSearchAndPaginationDto,
) {}
