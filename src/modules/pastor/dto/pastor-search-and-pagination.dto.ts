import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

import { BaseSearchAndPaginationDto } from '@/common/dtos/base-search-and-pagination.dto';
import { MemberSearchType } from '@/common/enums/member-search-type.enum';

export class PastorSearchOptionsDto {
  @ApiProperty({
    name: 'searchType',
    enum: MemberSearchType,
    description: 'Choose one of the types to perform a search.',
    example: MemberSearchType.FirstNames,
  })
  @IsEnum(MemberSearchType)
  @IsNotEmpty()
  searchType: MemberSearchType;
}

export class PastorSearchAndPaginationDto extends IntersectionType(
  PastorSearchOptionsDto,
  BaseSearchAndPaginationDto,
) {}
