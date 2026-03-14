import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsOrderValue, Repository } from 'typeorm';
import { isUUID } from 'class-validator';
import { BaseService } from '@/common/services/base.service';

import { User } from '@/modules/user/entities/user.entity';
import { Church } from '@/modules/church/entities/church.entity';
import { CreateCalendarEventDto } from '@/modules/calendar-events/dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from '@/modules/calendar-events/dto/update-calendar-event.dto';
import { CalendarEvent } from '@/modules/calendar-events/entities/calendar-event.entity';
import { CalendarEventPaginationDto } from '@/modules/calendar-events/dto/calendar-event-pagination.dto';
import { CalendarEventSearchAndPaginationDto } from '@/modules/calendar-events/dto/calendar-event-search-and-pagination.dto';
import { CalendarEventSearchStrategyFactory } from '@/modules/calendar-events/strategies/calendar-event-search-strategy.factory';

@Injectable()
export class CalendarEventsService extends BaseService {
  constructor(
    @InjectRepository(CalendarEvent)
    private readonly calendarEventRepository: Repository<CalendarEvent>,
    private readonly calendarEventSearchStrategyFactory: CalendarEventSearchStrategyFactory,

    @InjectRepository(Church)
    private readonly churchRepository: Repository<Church>,
  ) {
    super();
  }

  //* Create
  async create(
    createCalendarEventDto: CreateCalendarEventDto,
    user: User,
  ): Promise<CalendarEvent> {
    const { churchId, ...rest } = createCalendarEventDto;

    try {
      const calendarEvent = this.calendarEventRepository.create({
        ...rest,
        ...(churchId && { church: { id: churchId } }),
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
    const { limit = 10, offset = 0, churchId, order } = queryDto;

    let church: Church;
    if (churchId) {
      church = await this.churchRepository.findOne({
        where: { id: churchId },
        order: { createdAt: order as FindOptionsOrderValue },
      });

      if (!church) {
        throw new NotFoundException(
          `Iglesia con id ${churchId} no fue encontrada.`,
        );
      }
    }

    const calendarEvents = await this.calendarEventRepository.find({
      where: {
        church: church,
      },
      take: limit,
      skip: offset,
      relations: ['updatedBy', 'createdBy', 'church'],
      order: { createdAt: order as FindOptionsOrderValue },
    });

    return calendarEvents;
  }

  //* Find by filters
  async findByFilters(
    searchAndPaginationDto: CalendarEventSearchAndPaginationDto,
  ): Promise<CalendarEvent[]> {
    const { searchType, term, limit, offset, order } = searchAndPaginationDto;

    if (!term) {
      throw new BadRequestException('El término de búsqueda es requerido.');
    }

    return this.calendarEventSearchStrategyFactory
      .getStrategy(searchType)
      .execute({
        term,
        searchType,
        limit,
        offset,
        order,
        calendarEventRepository: this.calendarEventRepository,
      });
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

    const { churchId, ...rest } = updateCalendarEventDto;

    try {
      const updatedEvent = await this.calendarEventRepository.preload({
        id: calendarEvent.id,
        ...rest,
        ...(churchId && { church: { id: churchId } }),
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
