import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';

import { CalendarEvent } from '@/modules/calendar-events/entities/calendar-event.entity';

import { WhatsappService } from './whatsapp.service';
import { formatEventMessage } from './helpers/event-message.formatter';

@Injectable()
export class WhatsappNotificationService {
  private readonly logger = new Logger(WhatsappNotificationService.name);

  constructor(
    @InjectRepository(CalendarEvent)
    private readonly calendarEventRepository: Repository<CalendarEvent>,
    private readonly whatsappService: WhatsappService,
    private readonly configService: ConfigService,
  ) {}

  //* Cron: todos los días a las 8:00 AM hora Perú (UTC-5 = 13:00 UTC)
  @Cron('0 13 * * *', {
    name: 'event-notifications',
    timeZone: 'America/Lima',
  })
  async handleDailyEventNotifications(): Promise<void> {
    this.logger.log('Cron ejecutado — verificando eventos del día');
    await this.sendTodayEventNotifications();
  }

  //* Envía notificaciones de los eventos de HOY a los grupos configurados
  async sendTodayEventNotifications(): Promise<{
    sent: number;
    events: string[];
  }> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const events = await this.calendarEventRepository.find({
      where: { startDate: Between(todayStart, todayEnd) },
      order: { startDate: 'ASC' },
    });

    if (events.length === 0) {
      this.logger.log('No hay eventos para hoy');
      return { sent: 0, events: [] };
    }

    const groupJids = this.getConfiguredGroupJids();

    if (groupJids.length === 0) {
      this.logger.warn(
        'WSP_GROUP_JIDS no configurado — no se enviaron notificaciones',
      );
      return { sent: 0, events: [] };
    }

    const sentTitles: string[] = [];

    for (const event of events) {
      const message = formatEventMessage(event);

      await Promise.all(
        groupJids.map((jid) => this.whatsappService.sendText(jid, message)),
      );

      sentTitles.push(event.title);
      this.logger.log(
        `Notificación enviada: "${event.title}" → ${groupJids.length} grupo(s)`,
      );
    }

    return { sent: events.length, events: sentTitles };
  }

  //* Lee los JIDs de grupos desde la variable de entorno
  getConfiguredGroupJids(): string[] {
    const raw = this.configService.get<string>('WSP_GROUP_JIDS') ?? '';
    return raw
      .split(',')
      .map((jid) => jid.trim())
      .filter((jid) => jid.length > 0);
  }
}
