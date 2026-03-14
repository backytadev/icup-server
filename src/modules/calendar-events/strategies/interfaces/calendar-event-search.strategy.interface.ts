import { CalendarEvent } from '@/modules/calendar-events/entities/calendar-event.entity';
import { CalendarEventSearchStrategyProps } from './calendar-event-search-strategy-props.interface';

export interface CalendarEventSearchStrategy {
  execute(props: CalendarEventSearchStrategyProps): Promise<CalendarEvent[]>;
}
