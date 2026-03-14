import { Injectable, NotFoundException } from '@nestjs/common';
import { Between, FindOptionsOrderValue } from 'typeorm';

import { CalendarEvent } from '@/modules/calendar-events/entities/calendar-event.entity';
import { CalendarEventSearchTypeNames } from '@/modules/calendar-events/enums/calendar-event-search-type.enum';
import { CalendarEventSearchStrategy } from '../interfaces/calendar-event-search.strategy.interface';
import { CalendarEventSearchStrategyProps } from '../interfaces/calendar-event-search-strategy-props.interface';

@Injectable()
export class CalendarEventByDateStrategy implements CalendarEventSearchStrategy {
  async execute({
    term,
    searchType,
    limit,
    offset = 0,
    order,
    calendarEventRepository,
  }: CalendarEventSearchStrategyProps): Promise<CalendarEvent[]> {
    const [fromTimestamp, toTimestamp] = term.split('+').map(Number);

    if (isNaN(fromTimestamp)) {
      throw new NotFoundException('Formato de marca de tiempo inválido.');
    }

    const fromDate = new Date(fromTimestamp);
    const toDate = toTimestamp
      ? new Date(toTimestamp)
      : new Date(fromTimestamp);

    if (!toTimestamp) {
      toDate.setHours(23, 59, 59, 999);
    }

    const events = await calendarEventRepository.find({
      where: { startDate: Between(fromDate, toDate) },
      take: limit,
      skip: offset,
      order: { startDate: order as FindOptionsOrderValue },
    });

    if (events.length === 0) {
      throw new NotFoundException(
        `No se encontraron eventos (${CalendarEventSearchTypeNames[searchType]}) para el rango de fechas: ${fromDate.toLocaleDateString('es-PE')} - ${toDate.toLocaleDateString('es-PE')}`,
      );
    }

    return events;
  }
}
