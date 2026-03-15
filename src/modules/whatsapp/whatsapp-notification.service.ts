import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';

import { CalendarEvent } from '@/modules/calendar-events/entities/calendar-event.entity';
import { CalendarEventTargetGroup } from '@/common/enums/calendar-event-target-group.enum';
import { Member } from '@/modules/member/entities/member.entity';

import { WhatsappService } from './whatsapp.service';
import {
  formatBirthdayMessage,
  formatEventMessage,
  formatEventsSummary,
} from './helpers/event-message.formatter';

@Injectable()
export class WhatsappNotificationService {
  private readonly logger = new Logger(WhatsappNotificationService.name);

  constructor(
    @InjectRepository(CalendarEvent)
    private readonly calendarEventRepository: Repository<CalendarEvent>,
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
    private readonly whatsappService: WhatsappService,
    private readonly configService: ConfigService,
  ) {}

  //* Cron: todos los días a las 8:00 AM hora Perú
  @Cron('00 18 * * *', {
    name: 'event-notifications',
    timeZone: 'America/Lima',
  })
  async handleDailyEventNotifications(): Promise<void> {
    this.logger.log('Cron ejecutado — verificando eventos del día');
    // await this.sendTodayEventNotifications();
    await this.sendTodayEventSummaryNotifications();
  }

  //* Cron: todos los días a las 6:00 AM hora Perú
  @Cron('00 08 * * *', {
    name: 'birthday-notifications',
    timeZone: 'America/Lima',
  })
  async handleDailyBirthdayNotifications(): Promise<void> {
    this.logger.log('Cron ejecutado — verificando cumpleaños del día');
    await this.sendTodayBirthdayNotifications();
  }

  //* Envía notificaciones de los eventos de HOY a los grupos correspondientes
  async sendTodayEventNotifications(): Promise<{
    sent: number;
    events: string[];
  }> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const allEvents = await this.calendarEventRepository.find({
      where: { startDate: Between(todayStart, todayEnd) },
      order: { startDate: 'ASC' },
    });

    if (allEvents.length === 0) {
      this.logger.log('No hay eventos de tipo Meetings para hoy');
      return { sent: 0, events: [] };
    }

    const jidMap = this.getGroupJidMap();

    //* Recolectar todos los JIDs únicos que recibirán al menos un evento
    const allJids = new Set<string>();
    for (const event of allEvents) {
      this.resolveJidsForEvent(event, jidMap).forEach((jid) =>
        allJids.add(jid),
      );
    }

    if (allJids.size === 0) {
      this.logger.warn(
        'Ningún grupo destino configurado — no se enviaron notificaciones',
      );
      return { sent: 0, events: [] };
    }

    //* Saludo inicial — se envía UNA sola vez a cada grupo
    const now = new Date();
    const hour = Number(
      now.toLocaleString('es-PE', {
        hour: 'numeric',
        hour12: false,
        timeZone: 'America/Lima',
      }),
    );

    const saludo =
      hour >= 5 && hour < 12
        ? '¡Buenos días!'
        : hour >= 12 && hour < 19
          ? '¡Buenas tardes!'
          : '¡Buenas noches!';

    const greeting =
      `👋 ${saludo} Soy *ICUPI BOT*, tu asistente de notificaciones\n` +
      `📋 A continuación te comparto los eventos programados para el día de hoy:`;

    await Promise.all(
      [...allJids].map((jid) => this.whatsappService.sendText(jid, greeting)),
    );

    await new Promise((resolve) => setTimeout(resolve, 2000));

    //* Envío de cada evento
    const sentTitles: string[] = [];

    for (const event of allEvents) {
      const targetJids = this.resolveJidsForEvent(event, jidMap);

      if (targetJids.length === 0) {
        this.logger.warn(
          `"${event.title}" — ningún grupo destino configurado (targetGroups: ${event.targetGroups.join(', ')})`,
        );
        continue;
      }

      const message = formatEventMessage(event);
      const hasImage = event.imageUrls?.length > 0;
      const hasLocation = !!(event.latitude && event.longitude);

      if (hasImage) {
        await Promise.all(
          targetJids.map((jid) =>
            this.whatsappService.sendMedia(jid, event.imageUrls[0], message),
          ),
        );
      } else {
        await Promise.all(
          targetJids.map((jid) => this.whatsappService.sendText(jid, message)),
        );
      }

      if (hasLocation) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        await Promise.all(
          targetJids.map((jid) =>
            this.whatsappService.sendLocation(
              jid,
              Number(event.latitude),
              Number(event.longitude),
              event.locationName ?? event.title,
              event.locationReference ?? '',
            ),
          ),
        );
      }

      sentTitles.push(event.title);
      this.logger.log(
        `Notificación enviada: "${event.title}" → ${targetJids.length} grupo(s) [${event.targetGroups.join(', ')}]`,
      );

      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    return { sent: sentTitles.length, events: sentTitles };
  }

  //* Envía un único mensaje resumen con todos los eventos de hoy como lista
  async sendTodayEventSummaryNotifications(): Promise<{
    sent: number;
    events: string[];
  }> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const allEvents = await this.calendarEventRepository.find({
      where: { startDate: Between(todayStart, todayEnd) },
      order: { startDate: 'ASC' },
    });

    if (allEvents.length === 0) {
      this.logger.log('No hay eventos de tipo Meetings para hoy');
      return { sent: 0, events: [] };
    }

    const jidMap = this.getGroupJidMap();

    //* Agrupar eventos por JID destinatario
    const jidEventsMap = new Map<string, typeof allEvents>();
    for (const event of allEvents) {
      for (const jid of this.resolveJidsForEvent(event, jidMap)) {
        if (!jidEventsMap.has(jid)) jidEventsMap.set(jid, []);
        jidEventsMap.get(jid).push(event);
      }
    }

    if (jidEventsMap.size === 0) {
      this.logger.warn(
        'Ningún grupo destino configurado — no se enviaron notificaciones',
      );
      return { sent: 0, events: [] };
    }

    //* Enviar un único mensaje resumen a cada grupo
    await Promise.all(
      [...jidEventsMap.entries()].map(([jid, groupEvents]) => {
        const summary = formatEventsSummary(groupEvents);
        return this.whatsappService.sendText(jid, summary);
      }),
    );

    const sentTitles = allEvents.map((e) => e.title);
    this.logger.log(
      `Resumen enviado a ${jidEventsMap.size} grupo(s) — ${allEvents.length} evento(s)`,
    );

    return { sent: allEvents.length, events: sentTitles };
  }

  //* Envía saludos de cumpleaños de los miembros que cumplen años hoy
  async sendTodayBirthdayNotifications(): Promise<{
    sent: number;
    members: string[];
  }> {
    const now = new Date();
    const month = now.toLocaleString('es-PE', {
      month: 'numeric',
      timeZone: 'America/Lima',
    });
    const day = now.toLocaleString('es-PE', {
      day: 'numeric',
      timeZone: 'America/Lima',
    });

    const members = await this.memberRepository
      .createQueryBuilder('member')
      .where('EXTRACT(MONTH FROM member.birth_date) = :month', {
        month: Number(month),
      })
      .andWhere('EXTRACT(DAY FROM member.birth_date) = :day', {
        day: Number(day),
      })
      .orderBy('member.first_names', 'ASC')
      .getMany();

    if (members.length === 0) {
      this.logger.log('No hay cumpleaños hoy');
      return { sent: 0, members: [] };
    }

    const generalJid =
      this.configService.get<string>('WSP_GROUP_GENERAL_JID') ?? '';

    if (!generalJid) {
      this.logger.warn(
        'WSP_GROUP_GENERAL_JID no configurado — no se enviaron saludos de cumpleaños',
      );
      return { sent: 0, members: [] };
    }

    const message = formatBirthdayMessage(members);
    await this.whatsappService.sendText(generalJid, message);

    const memberNames = members.map((m) => `${m.firstNames} ${m.lastNames}`);
    this.logger.log(
      `Saludos de cumpleaños enviados: ${memberNames.join(', ')}`,
    );

    return { sent: members.length, members: memberNames };
  }

  //* Retorna el mapa targetGroup → JID configurado en env vars
  getGroupJidMap(): Record<string, string> {
    return {
      [CalendarEventTargetGroup.General]:
        this.configService.get<string>('WSP_GROUP_GENERAL_JID') ?? '',
      [CalendarEventTargetGroup.Youth]:
        this.configService.get<string>('WSP_GROUP_YOUTH_JID') ?? '',
      [CalendarEventTargetGroup.Teenagers]:
        this.configService.get<string>('WSP_GROUP_TEENAGERS_JID') ?? '',
      [CalendarEventTargetGroup.Leaders]:
        this.configService.get<string>('WSP_GROUP_LEADERS_JID') ?? '',
      [CalendarEventTargetGroup.Intercession]:
        this.configService.get<string>('WSP_GROUP_INTERCESSION_JID') ?? '',
      [CalendarEventTargetGroup.Evangelism]:
        this.configService.get<string>('WSP_GROUP_EVANGELISM_JID') ?? '',
    };
  }

  //* Resuelve los JIDs únicos para un evento según sus targetGroups
  private resolveJidsForEvent(
    event: CalendarEvent,
    jidMap: Record<string, string>,
  ): string[] {
    const jids = event.targetGroups
      .map((group) => jidMap[group])
      .filter((jid): jid is string => !!jid);

    return [...new Set(jids)];
  }
}
