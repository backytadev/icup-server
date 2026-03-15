import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@/modules/auth/auth.module';
import { CalendarEvent } from '@/modules/calendar-events/entities/calendar-event.entity';
import { Member } from '@/modules/member/entities/member.entity';

import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappNotificationService } from './whatsapp-notification.service';
import { WhatsappWebhookService } from './whatsapp-webhook.service';

const REQUIRED_ENV_VARS = [
  'EVOLUTION_API_URL',
  'EVOLUTION_API_INSTANCE',
  'EVOLUTION_API_KEY',
];

@Module({
  imports: [TypeOrmModule.forFeature([CalendarEvent, Member]), AuthModule],
  controllers: [WhatsappController],
  providers: [
    WhatsappService,
    WhatsappNotificationService,
    WhatsappWebhookService,
  ],
  exports: [
    WhatsappService,
    WhatsappNotificationService,
    WhatsappWebhookService,
  ],
})
export class WhatsappModule implements OnModuleInit {
  private readonly logger = new Logger(WhatsappModule.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const missing = REQUIRED_ENV_VARS.filter(
      (key) => !this.configService.get<string>(key),
    );

    if (missing.length > 0) {
      this.logger.error(
        `WhatsApp module — variables de entorno faltantes: ${missing.join(', ')}. ` +
          `El módulo no funcionará correctamente.`,
      );
    } else {
      this.logger.log('WhatsApp module — variables de entorno OK ✓');
    }
  }
}
