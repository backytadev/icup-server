import { IntersectionType } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

import { BaseSearchAndPaginationDto } from '@/common/dtos/base-search-and-pagination.dto';
import { CalendarEventSearchType } from '@/modules/calendar-events/enums/calendar-event-search-type.enum';

export class CalendarEventSearchOptionsDto {
  @ApiProperty({
    name: 'searchType',
    enum: CalendarEventSearchType,
    description: 'Tipo de búsqueda a realizar.',
    example: CalendarEventSearchType.Title,
  })
  @IsEnum(CalendarEventSearchType)
  @IsNotEmpty()
  searchType: CalendarEventSearchType;
}

export class CalendarEventSearchAndPaginationDto extends IntersectionType(
  CalendarEventSearchOptionsDto,
  BaseSearchAndPaginationDto,
) {}
