import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@/modules/auth/auth.module';

import { CalendarEventsService } from './calendar-events.service';
import { CalendarEventsController } from './calendar-events.controller';
import { CalendarEvent } from './entities/calendar-event.entity';

import { CalendarEventSearchStrategyFactory } from './strategies/calendar-event-search-strategy.factory';
import { CalendarEventByDateStrategy } from './strategies/options/calendar-event-by-date.strategy';
import { CalendarEventByTitleStrategy } from './strategies/options/calendar-event-by-title.strategy';
import { CalendarEventByCategoryStrategy } from './strategies/options/calendar-event-by-category.strategy';
import { CalendarEventByTargetGroupStrategy } from './strategies/options/calendar-event-by-target-group.strategy';
import { CalendarEventByStatusStrategy } from './strategies/options/calendar-event-by-status.strategy';
import { ChurchModule } from '../church/church.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CalendarEvent]),
    AuthModule,
    forwardRef(() => ChurchModule),
  ],
  controllers: [CalendarEventsController],
  providers: [
    CalendarEventsService,
    CalendarEventSearchStrategyFactory,
    CalendarEventByDateStrategy,
    CalendarEventByTitleStrategy,
    CalendarEventByCategoryStrategy,
    CalendarEventByTargetGroupStrategy,
    CalendarEventByStatusStrategy,
  ],
  exports: [TypeOrmModule, CalendarEventsService],
})
export class CalendarEventsModule {}
