import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  CalendarEventTargetGroup,
  CalendarEventTargetGroupNames,
} from '@/common/enums/calendar-event-target-group.enum';
import { CalendarEvent } from '@/modules/calendar-events/entities/calendar-event.entity';
import { CalendarEventSearchTypeNames } from '@/modules/calendar-events/enums/calendar-event-search-type.enum';
import { CalendarEventSearchStrategy } from '../interfaces/calendar-event-search.strategy.interface';
import { CalendarEventSearchStrategyProps } from '../interfaces/calendar-event-search-strategy-props.interface';

@Injectable()
export class CalendarEventByTargetGroupStrategy implements CalendarEventSearchStrategy {
  async execute({
    term,
    searchType,
    limit,
    offset = 0,
    order,
    calendarEventRepository,
  }: CalendarEventSearchStrategyProps): Promise<CalendarEvent[]> {
    const validGroups = Object.values(CalendarEventTargetGroup);

    if (!validGroups.includes(term as CalendarEventTargetGroup)) {
      throw new BadRequestException(
        `Grupo no válido: ${term}. Valores válidos: ${validGroups.join(', ')}`,
      );
    }

    const events = await calendarEventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.createdBy', 'createdBy')
      .leftJoinAndSelect('event.updatedBy', 'updatedBy')
      .leftJoinAndSelect('event.church', 'church')
      .where(':group = ANY(event."targetGroups")', { group: term })
      .orderBy('event.startDate', order as 'ASC' | 'DESC')
      .take(limit)
      .skip(offset)
      .getMany();

    if (events.length === 0) {
      throw new NotFoundException(
        `No se encontraron eventos (${CalendarEventSearchTypeNames[searchType]}) para el grupo: ${CalendarEventTargetGroupNames[term]}`,
      );
    }

    return events;
  }
}
