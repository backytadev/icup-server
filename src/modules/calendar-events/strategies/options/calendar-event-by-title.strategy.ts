import { Injectable, NotFoundException } from '@nestjs/common';

import { CalendarEvent } from '@/modules/calendar-events/entities/calendar-event.entity';
import { CalendarEventSearchTypeNames } from '@/modules/calendar-events/enums/calendar-event-search-type.enum';
import { CalendarEventSearchStrategy } from '../interfaces/calendar-event-search.strategy.interface';
import { CalendarEventSearchStrategyProps } from '../interfaces/calendar-event-search-strategy-props.interface';

@Injectable()
export class CalendarEventByTitleStrategy implements CalendarEventSearchStrategy {
  async execute({
    term,
    searchType,
    limit,
    offset = 0,
    order,
    calendarEventRepository,
  }: CalendarEventSearchStrategyProps): Promise<CalendarEvent[]> {
    const events = await calendarEventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.createdBy', 'createdBy')
      .leftJoinAndSelect('event.updatedBy', 'updatedBy')
      .leftJoinAndSelect('event.church', 'church')
      .where('unaccent(LOWER(event.title)) LIKE unaccent(:term)', {
        term: `%${term.toLowerCase()}%`,
      })
      .orderBy('event.startDate', order as 'ASC' | 'DESC')
      .take(limit)
      .skip(offset)
      .getMany();

    if (events.length === 0) {
      throw new NotFoundException(
        `No se encontraron eventos (${CalendarEventSearchTypeNames[searchType]}) con el título: ${term}`,
      );
    }

    return events;
  }
}
