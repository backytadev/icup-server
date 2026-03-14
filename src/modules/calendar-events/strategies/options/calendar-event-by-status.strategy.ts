import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FindOptionsOrderValue } from 'typeorm';

import {
  CalendarEventStatus,
  CalendarEventStatusNames,
} from '@/common/enums/calendar-event-status.enum';
import { CalendarEvent } from '@/modules/calendar-events/entities/calendar-event.entity';
import { CalendarEventSearchTypeNames } from '@/modules/calendar-events/enums/calendar-event-search-type.enum';
import { CalendarEventSearchStrategy } from '../interfaces/calendar-event-search.strategy.interface';
import { CalendarEventSearchStrategyProps } from '../interfaces/calendar-event-search-strategy-props.interface';

@Injectable()
export class CalendarEventByStatusStrategy implements CalendarEventSearchStrategy {
  async execute({
    term,
    searchType,
    limit,
    offset = 0,
    order,
    calendarEventRepository,
  }: CalendarEventSearchStrategyProps): Promise<CalendarEvent[]> {
    const validStatuses = Object.values(CalendarEventStatus);

    if (!validStatuses.includes(term as CalendarEventStatus)) {
      throw new BadRequestException(
        `Estado no válido: ${term}. Valores válidos: ${validStatuses.join(', ')}`,
      );
    }

    const events = await calendarEventRepository.find({
      where: { status: term },
      take: limit,
      skip: offset,
      order: { startDate: order as FindOptionsOrderValue },
    });

    if (events.length === 0) {
      throw new NotFoundException(
        `No se encontraron eventos (${CalendarEventSearchTypeNames[searchType]}) con estado: ${CalendarEventStatusNames[term]}`,
      );
    }

    return events;
  }
}
