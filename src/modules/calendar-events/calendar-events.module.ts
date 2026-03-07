import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@/modules/auth/auth.module';

import { CalendarEventsService } from './calendar-events.service';
import { CalendarEventsController } from './calendar-events.controller';
import { CalendarEvent } from './entities/calendar-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CalendarEvent]), AuthModule],
  controllers: [CalendarEventsController],
  providers: [CalendarEventsService],
  exports: [TypeOrmModule, CalendarEventsService],
})
export class CalendarEventsModule {}
