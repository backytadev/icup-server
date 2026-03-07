import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import { Auth } from '@/common/decorators/auth.decorator';
import { PublicOrAuth } from '@/common/decorators/public-or-auth.decorator';
import { GetUser } from '@/common/decorators/get-user.decorator';
import { UserRole } from '@/common/enums/user-role.enum';
import {
  CreateSwagger,
  DeleteSwagger,
  FindAllSwagger,
  FindOneSwagger,
  UpdateSwagger,
} from '@/common/swagger/swagger.decorator';

import { User } from '@/modules/user/entities/user.entity';

import { CalendarEventsService } from './calendar-events.service';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';
import { CalendarEventPaginationDto } from './dto/calendar-event-pagination.dto';
import { CalendarEvent } from './entities/calendar-event.entity';

@Controller('calendar-events')
@ApiTags('Calendar Events')
@ApiBearerAuth()
@SkipThrottle()
export class CalendarEventsController {
  constructor(private readonly calendarEventsService: CalendarEventsService) {}

  //* Create (Private - Auth required)
  @Post()
  @Auth(UserRole.SuperUser, UserRole.MembershipUser)
  @CreateSwagger({ description: 'Event created successfully' })
  create(
    @Body() createCalendarEventDto: CreateCalendarEventDto,
    @GetUser() user: User,
  ): Promise<CalendarEvent> {
    return this.calendarEventsService.create(createCalendarEventDto, user);
  }

  //* Find all (Public with API key OR Private with Auth)
  @Get()
  @PublicOrAuth()
  @ApiSecurity('x-api-key')
  @FindAllSwagger({ description: 'Events retrieved successfully' })
  findAll(
    @Query() queryDto: CalendarEventPaginationDto,
  ): Promise<CalendarEvent[]> {
    return this.calendarEventsService.findAll(queryDto);
  }

  //* Find one (Public with API key OR Private with Auth)
  @Get(':id')
  @PublicOrAuth()
  @ApiSecurity('x-api-key')
  @FindOneSwagger({
    description: 'Event retrieved successfully',
    paramDescription: 'Event UUID',
  })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<CalendarEvent> {
    return this.calendarEventsService.findOne(id);
  }

  //* Update (Private - Auth required)
  @Patch(':id')
  @Auth(UserRole.SuperUser, UserRole.MembershipUser)
  @UpdateSwagger({
    description: 'Event updated successfully',
    paramDescription: 'Event UUID to update',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCalendarEventDto: UpdateCalendarEventDto,
    @GetUser() user: User,
  ): Promise<CalendarEvent> {
    return this.calendarEventsService.update(id, updateCalendarEventDto, user);
  }

  //* Delete (Private - Auth required - Hard delete)
  @Delete(':id')
  @Auth(UserRole.SuperUser, UserRole.MembershipUser)
  @DeleteSwagger({
    description: 'Event permanently deleted',
    paramDescription: 'Event UUID to delete',
  })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.calendarEventsService.remove(id);
  }
}
