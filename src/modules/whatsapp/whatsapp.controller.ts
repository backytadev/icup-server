import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import { Auth } from '@/common/decorators/auth.decorator';
import { UserRole } from '@/common/enums/user-role.enum';

import { WhatsappService } from './whatsapp.service';
import { WhatsappNotificationService } from './whatsapp-notification.service';
import { SendWspTextDto } from './dto/send-wsp-text.dto';
import { EvolutionGroup } from './interfaces/evolution-group.interface';
import { EvolutionInstance } from './interfaces/evolution-instance.interface';

@Controller('whatsapp')
@ApiTags('WhatsApp')
@ApiBearerAuth()
@SkipThrottle()
@Auth(UserRole.SuperUser)
export class WhatsappController {
  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly whatsappNotificationService: WhatsappNotificationService,
  ) {}

  //* GET /whatsapp/instance — info del número conectado y estado de la instancia
  @Get('instance')
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
  @ApiOperation({
    summary: 'Listar grupos de WhatsApp',
    description:
      'Retorna todos los grupos donde está conectada la instancia. ' +
      'Usa el campo "id" (xxx@g.us) como número destino al enviar mensajes.',
  })
  fetchGroups(): Promise<EvolutionGroup[]> {
    return this.whatsappService.fetchGroups();
  }

  //* GET /whatsapp/configured-groups — muestra los JIDs configurados para notificaciones
  @Get('configured-groups')
  @ApiOperation({
    summary: 'Grupos configurados para notificaciones',
    description:
      'Retorna los JIDs de grupos configurados en WSP_GROUP_JIDS que recibirán ' +
      'las notificaciones automáticas de eventos del cron.',
  })
  getConfiguredGroups(): { groupJids: string[] } {
    return {
      groupJids: this.whatsappNotificationService.getConfiguredGroupJids(),
    };
  }

  //* POST /whatsapp/send-test — envía mensaje de prueba
  @Post('send-test')
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
  @ApiOperation({
    summary: 'Enviar notificaciones de eventos de hoy (manual)',
    description:
      'Dispara manualmente el mismo proceso que ejecuta el cron diario. ' +
      'Busca eventos de hoy y envía mensajes formateados a los grupos configurados en WSP_GROUP_JIDS.',
  })
  notifyToday(): Promise<{ sent: number; events: string[] }> {
    return this.whatsappNotificationService.sendTodayEventNotifications();
  }
}
