import {
  Body,
  Controller,
  Get,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import { Auth } from '@/common/decorators/auth.decorator';
import { UserRole } from '@/common/enums/user-role.enum';

import { WhatsappService } from './whatsapp.service';
import { WhatsappNotificationService } from './whatsapp-notification.service';
import { WhatsappWebhookService } from './whatsapp-webhook.service';
import { SendWspTextDto } from './dto/send-wsp-text.dto';
import { EvolutionGroup } from './interfaces/evolution-group.interface';
import { EvolutionInstance } from './interfaces/evolution-instance.interface';
import { EvolutionWebhookPayload } from './interfaces/evolution-webhook.interface';

@Controller('whatsapp')
@ApiTags('WhatsApp')
@SkipThrottle()
export class WhatsappController {
  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly whatsappNotificationService: WhatsappNotificationService,
    private readonly whatsappWebhookService: WhatsappWebhookService,
  ) {}

  //* POST /whatsapp/webhook — recibe eventos de Evolution API
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook de Evolution API',
    description:
      'Endpoint que recibe eventos MESSAGES_UPSERT desde Evolution API. ' +
      'Requiere header "apiKey" con EVOLUTION_API_KEY. ' +
      'Procesa comandos de bot: !bot, !ayuda/!help, !eventos/!events, !ubicacion/!location.',
  })
  handleWebhook(@Body() payload: EvolutionWebhookPayload): Promise<void> {
    return this.whatsappWebhookService.handleWebhook(payload);
  }

  //* GET /whatsapp/instance — info del número conectado y estado de la instancia
  @Get('instance')
  @ApiBearerAuth()
  @Auth(UserRole.SuperUser)
  @ApiOperation({
    summary: 'Estado de la instancia WhatsApp',
    description:
      'Retorna el número conectado, nombre de perfil y estado de conexión ' +
      'de la instancia activa configurada en EVOLUTION_API_INSTANCE.',
  })
  getInstanceInfo(): Promise<EvolutionInstance> {
    return this.whatsappService.getInstanceInfo();
  }

  //* GET /whatsapp/groups — lista grupos con sus JIDs
  @Get('groups')
  @ApiBearerAuth()
  @Auth(UserRole.SuperUser)
  @ApiOperation({
    summary: 'Listar grupos de WhatsApp',
    description:
      'Retorna todos los grupos donde está conectada la instancia. ' +
      'Usa el campo "id" (xxx@g.us) como número destino al enviar mensajes.',
  })
  fetchGroups(): Promise<EvolutionGroup[]> {
    return this.whatsappService.fetchGroups();
  }

  //* GET /whatsapp/configured-groups — muestra el mapa targetGroup → JID configurado
  @Get('configured-groups')
  @ApiBearerAuth()
  @Auth(UserRole.SuperUser)
  @ApiOperation({
    summary: 'Grupos configurados para notificaciones',
    description:
      'Retorna el mapa de targetGroup → JID configurado en las variables de entorno. ' +
      'Los grupos con valor vacío no recibirán notificaciones.',
  })
  getConfiguredGroups(): Record<string, string> {
    return this.whatsappNotificationService.getGroupJidMap();
  }

  //* POST /whatsapp/send-test — envía mensaje de prueba
  @Post('send-test')
  @ApiBearerAuth()
  @Auth(UserRole.SuperUser)
  @ApiOperation({
    summary: 'Enviar mensaje de prueba',
    description:
      'Envía un mensaje de texto a un número o grupo de WhatsApp. ' +
      'Usa el JID del grupo (xxx@g.us) obtenido desde GET /whatsapp/groups.',
  })
  sendTest(@Body() dto: SendWspTextDto): Promise<void> {
    return this.whatsappService.sendText(
      dto.number,
      dto.text,
      dto.mentionsEveryOne,
    );
  }

  //* POST /whatsapp/notify-today — dispara el cron manualmente para probar
  @Post('notify-today')
  @ApiBearerAuth()
  @Auth(UserRole.SuperUser)
  @ApiOperation({
    summary: 'Enviar notificaciones de eventos de hoy (manual)',
    description:
      'Dispara manualmente el mismo proceso que ejecuta el cron diario. ' +
      'Busca eventos de hoy y envía UN mensaje por evento a los grupos configurados.',
  })
  notifyToday(): Promise<{ sent: number; events: string[] }> {
    return this.whatsappNotificationService.sendTodayEventNotifications();
  }

  //* POST /whatsapp/notify-today-summary — envía todos los eventos en un único mensaje de lista
  @Post('notify-today-summary')
  @ApiBearerAuth()
  @Auth(UserRole.SuperUser)
  @ApiOperation({
    summary: 'Enviar resumen de eventos de hoy (un solo mensaje)',
    description:
      'Busca los eventos de hoy y los envía como un único mensaje con formato de lista. ' +
      'Ideal para no saturar el grupo con múltiples mensajes.',
  })
  notifyTodaySummary(): Promise<{ sent: number; events: string[] }> {
    return this.whatsappNotificationService.sendTodayEventSummaryNotifications();
  }

  //* POST /whatsapp/notify-birthdays — dispara el cron de cumpleaños manualmente
  @Post('notify-birthdays')
  @ApiBearerAuth()
  @Auth(UserRole.SuperUser)
  @ApiOperation({
    summary: 'Enviar saludos de cumpleaños de hoy (manual)',
    description:
      'Dispara manualmente el proceso que ejecuta el cron de las 6 AM. ' +
      'Busca miembros que cumplen años hoy y envía un saludo al grupo general.',
  })
  notifyBirthdays(): Promise<{ sent: number; members: string[] }> {
    return this.whatsappNotificationService.sendTodayBirthdayNotifications();
  }
}
