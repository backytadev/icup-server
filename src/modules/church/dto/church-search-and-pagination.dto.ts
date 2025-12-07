import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

import { ChurchSearchType } from '@/modules/church/enums/church-search-type.enum';
import { BaseSearchAndPaginationDto } from '@/common/dtos/base-search-and-pagination.dto';

export class ChurchSearchOptionsDto {
  @ApiProperty({
    name: 'searchType',
    enum: ChurchSearchType,
    description: 'Choose one of the types to perform a search.',
    example: ChurchSearchType.ChurchName,
  })
  @IsEnum(ChurchSearchType)
  @IsNotEmpty()
  searchType: ChurchSearchType;
}

export class ChurchSearchAndPaginationDto extends IntersectionType(
  ChurchSearchOptionsDto,
  BaseSearchAndPaginationDto,
) {}
