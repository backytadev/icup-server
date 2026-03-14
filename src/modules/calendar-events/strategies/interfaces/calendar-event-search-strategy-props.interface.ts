import { Repository } from 'typeorm';

import { CalendarEventSearchType } from '@/modules/calendar-events/enums/calendar-event-search-type.enum';
import { CalendarEvent } from '@/modules/calendar-events/entities/calendar-event.entity';

export interface CalendarEventSearchStrategyProps {
  term: string;
  searchType: CalendarEventSearchType;
  limit?: number;
  offset?: number;
  order?: string;
  calendarEventRepository: Repository<CalendarEvent>;
}
