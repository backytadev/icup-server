import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

import { BaseSearchAndPaginationDto } from '@/common/dtos/base-search-and-pagination.dto';

import { OfferingIncomeSearchType } from '@/modules/offering/income/enums/offering-income-search-type.enum';
import { OfferingIncomeSearchSubType } from '@/modules/offering/income/enums/offering-income-search-sub-type.enum';

export class OfferingIncomeSearchOptionsDto {
  @ApiProperty({
    name: 'searchType',
    enum: OfferingIncomeSearchType,
    description: 'Choose one of the types to perform a search.',
    example: OfferingIncomeSearchType.SundayService,
  })
  @IsEnum(OfferingIncomeSearchType)
  @IsNotEmpty()
  searchType: OfferingIncomeSearchType;

  @ApiProperty({
    name: 'searchSubType',
    enum: OfferingIncomeSearchSubType,
    description: 'Choose one of the sub-types to perform a search.',
    example: OfferingIncomeSearchSubType.OfferingByDate,
    required: false,
  })
  @IsEnum(OfferingIncomeSearchSubType)
  @IsOptional()
  searchSubType?: OfferingIncomeSearchSubType;
}

export class OfferingIncomeSearchAndPaginationDto extends IntersectionType(
  OfferingIncomeSearchOptionsDto,
  BaseSearchAndPaginationDto,
) {}
