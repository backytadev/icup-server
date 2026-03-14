import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FindOptionsOrderValue } from 'typeorm';

import {
  CalendarEventCategory,
  CalendarEventCategoryNames,
} from '@/common/enums/calendar-event-category.enum';
import { CalendarEvent } from '@/modules/calendar-events/entities/calendar-event.entity';
import { CalendarEventSearchTypeNames } from '@/modules/calendar-events/enums/calendar-event-search-type.enum';
import { CalendarEventSearchStrategy } from '../interfaces/calendar-event-search.strategy.interface';
import { CalendarEventSearchStrategyProps } from '../interfaces/calendar-event-search-strategy-props.interface';

@Injectable()
export class CalendarEventByCategoryStrategy implements CalendarEventSearchStrategy {
  async execute({
    term,
    searchType,
    limit,
    offset = 0,
    order,
    calendarEventRepository,
  }: CalendarEventSearchStrategyProps): Promise<CalendarEvent[]> {
    const validCategories = Object.values(CalendarEventCategory);

    if (!validCategories.includes(term as CalendarEventCategory)) {
      throw new BadRequestException(
        `Categoría no válida: ${term}. Valores válidos: ${validCategories.join(', ')}`,
      );
    }

    const events = await calendarEventRepository.find({
      where: { category: term },
      take: limit,
      skip: offset,
      order: { startDate: order as FindOptionsOrderValue },
    });

    if (events.length === 0) {
      throw new NotFoundException(
        `No se encontraron eventos (${CalendarEventSearchTypeNames[searchType]}) con la categoría: ${CalendarEventCategoryNames[term]}`,
      );
    }

    return events;
  }
}
