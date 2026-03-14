import { BadRequestException, Injectable } from '@nestjs/common';

import {
  CalendarEventSearchType,
  CalendarEventSearchTypeNames,
} from '@/modules/calendar-events/enums/calendar-event-search-type.enum';
import { CalendarEventSearchStrategy } from './interfaces/calendar-event-search.strategy.interface';
import { CalendarEventByDateStrategy } from './options/calendar-event-by-date.strategy';
import { CalendarEventByTitleStrategy } from './options/calendar-event-by-title.strategy';
import { CalendarEventByCategoryStrategy } from './options/calendar-event-by-category.strategy';
import { CalendarEventByTargetGroupStrategy } from './options/calendar-event-by-target-group.strategy';
import { CalendarEventByStatusStrategy } from './options/calendar-event-by-status.strategy';

@Injectable()
export class CalendarEventSearchStrategyFactory {
  private readonly strategies: Map<
    CalendarEventSearchType,
    CalendarEventSearchStrategy
  >;

  constructor(
    byDate: CalendarEventByDateStrategy,
    byTitle: CalendarEventByTitleStrategy,
    byCategory: CalendarEventByCategoryStrategy,
    byTargetGroup: CalendarEventByTargetGroupStrategy,
    byStatus: CalendarEventByStatusStrategy,
  ) {
    this.strategies = new Map<
      CalendarEventSearchType,
      CalendarEventSearchStrategy
    >([
      [CalendarEventSearchType.Date, byDate],
      [CalendarEventSearchType.Title, byTitle],
      [CalendarEventSearchType.Category, byCategory],
      [CalendarEventSearchType.TargetGroup, byTargetGroup],
      [CalendarEventSearchType.Status, byStatus],
    ]);
  }

  getStrategy(type: CalendarEventSearchType): CalendarEventSearchStrategy {
    const strategy = this.strategies.get(type);

    if (!strategy) {
      throw new BadRequestException(
        `Tipo de búsqueda no válido: ${CalendarEventSearchTypeNames[type] ?? type}`,
      );
    }

    return strategy;
  }
}
