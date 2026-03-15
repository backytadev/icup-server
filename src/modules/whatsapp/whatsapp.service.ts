import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EvolutionGroup } from './interfaces/evolution-group.interface';
import { EvolutionInstance } from './interfaces/evolution-instance.interface';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  private readonly baseUrl: string;
  private readonly instance: string;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('EVOLUTION_API_URL');
    this.instance = this.configService.get<string>('EVOLUTION_API_INSTANCE');
    this.apiKey = this.configService.get<string>('EVOLUTION_API_KEY');
  }

  //* Envía un mensaje de texto a un número o JID de grupo
  async sendText(
    number: string,
    text: string,
    mentionsEveryOne = false,
  ): Promise<void> {
    const url = `${this.baseUrl}/message/sendText/${this.instance}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apiKey: this.apiKey,
        },
        body: JSON.stringify({ number, text, mentionsEveryOne, delay: 1500 }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Evolution API error ${response.status}: ${body}`);
      }

      this.logger.log(`Message sent to ${number}`);
    } catch (error) {
      this.logger.error('Failed to send WhatsApp message', error?.message);
      throw new InternalServerErrorException(
        `No se pudo enviar el mensaje de WhatsApp: ${error?.message}`,
      );
    }
  }

  //* Envía una imagen desde URL a un número o JID de grupo
  async sendMedia(
    number: string,
    mediaUrl: string,
    caption?: string,
  ): Promise<void> {
    const url = `${this.baseUrl}/message/sendMedia/${this.instance}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apiKey: this.apiKey,
        },
        body: JSON.stringify({
          number,
          mediatype: 'image',
          media: mediaUrl,
          delay: 2000,
          ...(caption ? { caption } : {}),
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Evolution API error ${response.status}: ${body}`);
      }

      this.logger.log(`Media sent to ${number}`);
    } catch (error) {
      this.logger.error('Failed to send WhatsApp media', error?.message);
      throw new InternalServerErrorException(
        `No se pudo enviar la imagen de WhatsApp: ${error?.message}`,
      );
    }
  }

  //* Envía un pin de ubicación a un número o JID de grupo
  async sendLocation(
    number: string,
    latitude: number,
    longitude: number,
    name?: string,
    address?: string,
  ): Promise<void> {
    const url = `${this.baseUrl}/message/sendLocation/${this.instance}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apiKey: this.apiKey,
        },
        body: JSON.stringify({
          number,
          latitude,
          longitude,
          name: '',
          address: [name, address].filter(Boolean).join(' · ') || '',
          delay: 2000,
        }),
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Evolution API error ${response.status}: ${body}`);
      }

      this.logger.log(`Location sent to ${number}`);
    } catch (error) {
      this.logger.error('Failed to send WhatsApp location', error?.message);
      throw new InternalServerErrorException(
        `No se pudo enviar la ubicación de WhatsApp: ${error?.message}`,
      );
    }
  }

  //* Lista todos los grupos donde está conectada la instancia
  async fetchGroups(): Promise<EvolutionGroup[]> {
    const url = `${this.baseUrl}/group/fetchAllGroups/${this.instance}?getParticipants=false`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { apiKey: this.apiKey },
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Evolution API error ${response.status}: ${body}`);
      }

      return response.json();
    } catch (error) {
      this.logger.error('Failed to fetch WhatsApp groups', error?.message);
      throw new InternalServerErrorException(
        `No se pudo obtener los grupos de WhatsApp: ${error?.message}`,
      );
    }
  }

  //* Retorna el estado y datos del número conectado a la instancia activa
  async getInstanceInfo(): Promise<EvolutionInstance> {
    const url = `${this.baseUrl}/instance/fetchInstances?instanceName=${this.instance}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { apiKey: this.apiKey },
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Evolution API error ${response.status}: ${body}`);
      }

      const data: any[] = await response.json();
      const instance = data[0];

      if (!instance) {
        throw new Error(`Instancia "${this.instance}" no encontrada`);
      }

      return {
        id: instance.id,
        name: instance.name,
        connectionStatus: instance.connectionStatus,
        ownerJid: instance.ownerJid,
        profileName: instance.profileName,
        profilePicUrl: instance.profilePicUrl,
        integration: instance.integration,
        number: instance.number,
      };
    } catch (error) {
      this.logger.error('Failed to fetch instance info', error?.message);
      throw new InternalServerErrorException(
        `No se pudo obtener la información de la instancia: ${error?.message}`,
      );
    }
  }
}
