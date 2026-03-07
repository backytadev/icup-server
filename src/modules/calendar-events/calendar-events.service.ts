import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isUUID } from 'class-validator';
import { BaseService } from '@/common/services/base.service';

import { User } from '@/modules/user/entities/user.entity';
import { CreateCalendarEventDto } from '@/modules/calendar-events/dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from '@/modules/calendar-events/dto/update-calendar-event.dto';
import { CalendarEvent } from '@/modules/calendar-events/entities/calendar-event.entity';
import { CalendarEventPaginationDto } from '@/modules/calendar-events/dto/calendar-event-pagination.dto';

@Injectable()
export class CalendarEventsService extends BaseService {
  constructor(
    @InjectRepository(CalendarEvent)
    private readonly calendarEventRepository: Repository<CalendarEvent>,
  ) {
    super();
  }

  //* Create
  async create(
    createCalendarEventDto: CreateCalendarEventDto,
    user: User,
  ): Promise<CalendarEvent> {
    try {
      const calendarEvent = this.calendarEventRepository.create({
        ...createCalendarEventDto,
        createdAt: new Date(),
        createdBy: user,
      });

      await this.calendarEventRepository.save(calendarEvent);

      return calendarEvent;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* Find all
  async findAll(
    queryDto: CalendarEventPaginationDto,
  ): Promise<CalendarEvent[]> {
    const { limit = 10, offset = 0, category, term } = queryDto;

    const query = this.calendarEventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.createdBy', 'createdBy')
      .leftJoinAndSelect('event.updatedBy', 'updatedBy')
      .orderBy('event.date', 'DESC');

    if (category) {
      query.andWhere('event.category = :category', { category });
    }

    if (term) {
      query.andWhere(
        '(LOWER(event.title) LIKE :term OR LOWER(event.description) LIKE :term OR LOWER(event.location) LIKE :term)',
        { term: `%${term.toLowerCase()}%` },
      );
    }

    return await query.take(limit).skip(offset).getMany();
  }

  //* Find one
  async findOne(id: string): Promise<CalendarEvent> {
    if (!isUUID(id)) {
      throw new BadRequestException(`ID ${id} is not a valid UUID`);
    }

    const calendarEvent = await this.calendarEventRepository.findOneBy({ id });

    if (!calendarEvent) {
      throw new NotFoundException(`Calendar event with id ${id} not found`);
    }

    return calendarEvent;
  }

  //* Update
  async update(
    id: string,
    updateCalendarEventDto: UpdateCalendarEventDto,
    user: User,
  ): Promise<CalendarEvent> {
    const calendarEvent = await this.findOne(id);

    try {
      const updatedEvent = await this.calendarEventRepository.preload({
        id: calendarEvent.id,
        ...updateCalendarEventDto,
        updatedAt: new Date(),
        updatedBy: user,
      });

      if (!updatedEvent) {
        throw new NotFoundException(`Calendar event with id ${id} not found`);
      }

      await this.calendarEventRepository.save(updatedEvent);

      return updatedEvent;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  //* Remove (Hard delete)
  async remove(id: string): Promise<void> {
    const calendarEvent = await this.findOne(id);

    try {
      await this.calendarEventRepository.remove(calendarEvent);
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }
}
