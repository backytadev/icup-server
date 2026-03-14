import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '@/modules/auth/auth.module';
import { CalendarEvent } from '@/modules/calendar-events/entities/calendar-event.entity';

import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappNotificationService } from './whatsapp-notification.service';

@Module({
  imports: [TypeOrmModule.forFeature([CalendarEvent]), AuthModule],
  controllers: [WhatsappController],
  providers: [WhatsappService, WhatsappNotificationService],
  exports: [WhatsappService, WhatsappNotificationService],
})
export class WhatsappModule {}
