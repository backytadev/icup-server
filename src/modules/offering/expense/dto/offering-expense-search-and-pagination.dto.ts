import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

import { BaseSearchAndPaginationDto } from '@/common/dtos/base-search-and-pagination.dto';

import { OfferingExpenseSearchType } from '@/modules/offering/expense/enums/offering-expense-search-type.enum';
import { OfferingExpenseSearchSubType } from '@/modules/offering/expense/enums/offering-expense-search-sub-type.enum';

export class OfferingExpenseSearchOptionsDto {
  @ApiProperty({
    name: 'searchType',
    enum: OfferingExpenseSearchType,
    description: 'Choose one of the types to perform a search.',
    example: OfferingExpenseSearchType.OperationalExpenses,
  })
  @IsEnum(OfferingExpenseSearchType)
  @IsNotEmpty()
  searchType: OfferingExpenseSearchType;

  @ApiProperty({
    name: 'searchSubType',
    enum: OfferingExpenseSearchSubType,
    description: 'Choose one of the sub-types to perform a search.',
    example: OfferingExpenseSearchSubType.VenueRental,
    required: false,
  })
  @IsEnum(OfferingExpenseSearchSubType)
  @IsOptional()
  searchSubType?: OfferingExpenseSearchSubType;
}

export class OfferingExpenseSearchAndPaginationDto extends IntersectionType(
  OfferingExpenseSearchOptionsDto,
  BaseSearchAndPaginationDto,
) {}
