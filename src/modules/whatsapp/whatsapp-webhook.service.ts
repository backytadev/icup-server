import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Interval } from '@nestjs/schedule';
import { Repository, Between } from 'typeorm';

import { CalendarEvent } from '@/modules/calendar-events/entities/calendar-event.entity';

import { WhatsappService } from './whatsapp.service';
import { formatEventsSummary } from './helpers/event-message.formatter';
import { EvolutionWebhookPayload } from './interfaces/evolution-webhook.interface';

interface PendingState {
  command: 'ubicacion';
  options: CalendarEvent[];
  expiresAt: number;
}

interface EventsCache {
  data: CalendarEvent[];
  cachedAt: number;
}

const PENDING_TTL_MS = 5 * 60 * 1000; // 5 min
const EVENTS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 min
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 min

//* Cooldown por comando (ms). El follow-up "!ubicacion N" está exento.
const COOLDOWN_MS: Record<string, number> = {
  '!bot': 30_000,
  '!ayuda': 30_000,
  '!help': 30_000,
  '!eventos': 15_000,
  '!events': 15_000,
  '!ubicacion': 15_000,
  '!location': 15_000,
};

@Injectable()
export class WhatsappWebhookService {
  private readonly logger = new Logger(WhatsappWebhookService.name);

  //* Estado pendiente para selección de ubicación
  private readonly pendingState = new Map<string, PendingState>();

  //* Cooldowns por "jid:comando"
  private readonly cooldowns = new Map<string, number>();

  //* Caché de eventos del día
  private eventsCache: EventsCache | null = null;

  constructor(
    @InjectRepository(CalendarEvent)
    private readonly calendarEventRepository: Repository<CalendarEvent>,
    private readonly whatsappService: WhatsappService,
    private readonly configService: ConfigService,
  ) {}

  async handleWebhook(payload: EvolutionWebhookPayload): Promise<void> {
    try {
      //* P1: Validar apikey del body contra EVOLUTION_API_KEY
      const expectedKey = this.configService.get<string>('EVOLUTION_API_KEY');
      if (expectedKey && payload.apikey !== expectedKey) {
        this.logger.warn(`Webhook rechazado — apikey inválida`);
        return;
      }

      if (payload.event !== 'messages.upsert') return;

      const { key, message, pushName } = payload.data;

      if (key.fromMe) return;

      //* P4: Solo grupos (@g.us) — ignorar chats privados
      const jid = key.remoteJid;
      if (!jid.endsWith('@g.us')) return;

      const raw = (
        message?.conversation ??
        message?.extendedTextMessage?.text ??
        ''
      ).trim();

      //* Normalizar: minúsculas + quitar tildes + colapsar "! comando" → "!comando"
      const normalized = raw
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/^!\s+/, '!');

      if (!normalized.startsWith('!')) return;

      const parts = normalized.split(/\s+/);
      let command = parts[0];
      let arg: string | undefined = parts[1];

      //* Manejar número pegado al comando: "!ubicacion1" → command="!ubicacion", arg="1"
      const gluedMatch = command.match(/^(![a-z]+?)(\d+)$/);
      if (gluedMatch) {
        command = gluedMatch[1];
        arg = gluedMatch[2];
      }

      //* P2: Rate limiting — el follow-up "!ubicacion N" está exento del cooldown
      const isLocationFollowUp =
        (command === '!ubicacion' || command === '!location') && !!arg;

      if (!isLocationFollowUp && this.isOnCooldown(jid, command)) {
        this.logger.debug(
          `Cooldown activo para "${command}" en ${jid} — descartado silenciosamente`,
        );
        return;
      }

      this.logger.log(
        `Comando recibido: "${raw}" → "${command}" arg="${arg ?? ''}" de ${pushName ?? jid}`,
      );

      switch (command) {
        case '!bot':
          await this.handleBot(jid, pushName);
          break;
        case '!ayuda':
        case '!help':
          await this.handleHelp(jid);
          break;
        case '!eventos':
        case '!events':
          await this.handleEvents(jid);
          break;
        case '!ubicacion':
        case '!location':
          await this.handleLocation(jid, arg);
          break;
        default:
          //* P6: Silenciar comandos desconocidos — sin respuesta para no amplificar ruido
          break;
      }
    } catch (error) {
      //* Siempre retorna 200 a Evolution API — evita reintentos y mensajes duplicados
      this.logger.error(
        `Error procesando webhook: ${error?.message}`,
        error?.stack,
      );
    }
  }

  //* P2: Verifica y registra cooldown para un JID + comando
  private isOnCooldown(jid: string, command: string): boolean {
    const cooldownMs = COOLDOWN_MS[command];
    if (!cooldownMs) return false;

    const key = `${jid}:${command}`;
    const expiresAt = this.cooldowns.get(key);

    if (expiresAt && Date.now() < expiresAt) return true;

    this.cooldowns.set(key, Date.now() + cooldownMs);
    return false;
  }

  //* P3: Limpieza periódica de Maps en memoria (cada 10 min)
  @Interval(CLEANUP_INTERVAL_MS)
  cleanupExpiredEntries(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, state] of this.pendingState) {
      if (now > state.expiresAt) {
        this.pendingState.delete(key);
        cleaned++;
      }
    }

    for (const [key, expiresAt] of this.cooldowns) {
      if (now > expiresAt) {
        this.cooldowns.delete(key);
        cleaned++;
      }
    }

    //* Invalidar caché si es de un día anterior
    if (this.eventsCache) {
      const cacheDate = new Date(this.eventsCache.cachedAt);
      const today = new Date();
      if (cacheDate.toDateString() !== today.toDateString()) {
        this.eventsCache = null;
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug(`Cleanup: ${cleaned} entradas expiradas eliminadas`);
    }
  }

  //* !bot — presentación del bot
  private async handleBot(jid: string, pushName?: string): Promise<void> {
    const greeting = pushName ? `¡Hola, ${pushName}! 👋` : `¡Hola! 👋`;
    const message =
      `${greeting}\n` +
      `Soy *ICUPI BOT* 🤖, el asistente oficial de la\n` +
      `*Iglesia Cristiana Unidos en su Presencia (ICUP)*.\n\n` +
      `Estoy aquí para mantenerte informado sobre lo que sucede en nuestra comunidad.\n\n` +
      `*¿Qué puedo hacer por ti?*\n` +
      `─────────────────────\n` +
      `📋 Consultarte los *eventos del día*\n` +
      `📍 Enviarte la *ubicación* de cualquier reunión\n` +
      `❓ Mostrarte todos los *comandos disponibles*\n` +
      `─────────────────────\n` +
      `_Escribe *!ayuda* o *!help* para ver la lista completa de comandos._`;

    await this.whatsappService.sendText(jid, message);
  }

  //* !ayuda / !help — lista todos los comandos disponibles
  private async handleHelp(jid: string): Promise<void> {
    const message =
      `🤖 *ICUPI BOT — Comandos disponibles*\n` +
      `─────────────────────\n` +
      `📋 *!eventos* · *!events* — Agenda de eventos del día\n` +
      `📍 *!ubicacion* · *!location* — Ubicación de los eventos de hoy\n` +
      `🤖 *!bot* — Conoce al asistente\n` +
      `❓ *!ayuda* · *!help* — Muestra este mensaje\n` +
      `─────────────────────\n` +
      `_Escribe el comando en el grupo y te responderé al instante._`;

    await this.whatsappService.sendText(jid, message);
  }

  //* !eventos / !events — resumen de eventos del día
  private async handleEvents(jid: string): Promise<void> {
    const events = await this.getTodayEvents();

    if (events.length === 0) {
      await this.whatsappService.sendText(
        jid,
        `📋 No hay eventos programados para hoy.`,
      );
      return;
    }

    const message = formatEventsSummary(events);
    await this.whatsappService.sendText(jid, message);
  }

  //* !ubicacion / !location / !ubicacion [n] — ubicación de eventos de hoy
  private async handleLocation(
    jid: string,
    arg: string | undefined,
  ): Promise<void> {
    //* Si viene con número → buscar en el estado pendiente
    if (arg) {
      const index = parseInt(arg, 10);

      if (isNaN(index)) {
        await this.whatsappService.sendText(
          jid,
          `⚠️ Indica un número válido. Ej: *!ubicacion 1*`,
        );
        return;
      }

      const state = this.pendingState.get(jid);

      if (!state || Date.now() > state.expiresAt) {
        this.pendingState.delete(jid);
        await this.whatsappService.sendText(
          jid,
          `⏱️ La selección expiró. Escribe *!ubicacion* de nuevo para ver la lista.`,
        );
        return;
      }

      const event = state.options[index - 1];

      if (!event) {
        await this.whatsappService.sendText(
          jid,
          `⚠️ Número fuera de rango. Elige entre 1 y ${state.options.length}.`,
        );
        return;
      }

      this.pendingState.delete(jid);

      await this.whatsappService.sendLocation(
        jid,
        Number(event.latitude),
        Number(event.longitude),
        event.locationName ?? event.title,
        event.locationReference ?? '',
      );
      return;
    }

    //* Sin número → consultar eventos con ubicación y listar
    const events = await this.getTodayEvents();
    const eventsWithLocation = events.filter((e) => e.latitude && e.longitude);

    if (eventsWithLocation.length === 0) {
      await this.whatsappService.sendText(
        jid,
        `📍 Ningún evento de hoy tiene ubicación registrada.`,
      );
      return;
    }

    //* Si solo hay uno, enviar directo sin lista
    if (eventsWithLocation.length === 1) {
      const event = eventsWithLocation[0];
      await this.whatsappService.sendLocation(
        jid,
        Number(event.latitude),
        Number(event.longitude),
        event.locationName ?? event.title,
        event.locationReference ?? '',
      );
      return;
    }

    //* Más de uno → guardar estado y mostrar lista
    this.pendingState.set(jid, {
      command: 'ubicacion',
      options: eventsWithLocation,
      expiresAt: Date.now() + PENDING_TTL_MS,
    });

    const numbers = [
      '1️⃣',
      '2️⃣',
      '3️⃣',
      '4️⃣',
      '5️⃣',
      '6️⃣',
      '7️⃣',
      '8️⃣',
      '9️⃣',
      '🔟',
    ];

    const lines = [
      `📍 *¿De qué evento necesitas la ubicación?*`,
      `─────────────────────`,
    ];

    eventsWithLocation.forEach((event, i) => {
      const num = numbers[i] ?? `${i + 1}.`;
      lines.push(
        `${num} *${event.title}*${event.locationName ? `\n   📌 ${event.locationName}` : ''}`,
      );
    });

    lines.push(`─────────────────────`);
    lines.push(`_Responde con !ubicacion 1, !ubicacion 2, etc._`);
    lines.push(`_Esta selección expira en 5 minutos._`);

    await this.whatsappService.sendText(jid, lines.join('\n'));
  }

  //* P5: Helper con caché de 5 min — evita queries repetidas a la BD
  private async getTodayEvents(): Promise<CalendarEvent[]> {
    const now = Date.now();

    if (
      this.eventsCache &&
      now - this.eventsCache.cachedAt < EVENTS_CACHE_TTL_MS
    ) {
      return this.eventsCache.data;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const data = await this.calendarEventRepository.find({
      where: { startDate: Between(todayStart, todayEnd) },
      order: { startDate: 'ASC' },
    });

    this.eventsCache = { data, cachedAt: now };
    return data;
  }
}
