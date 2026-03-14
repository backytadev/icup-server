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
    this.apiKey = this.configService.get<string>('EVOLUTION_AUTH_KEY');
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
          apikey: this.apiKey,
        },
        body: JSON.stringify({ number, text, mentionsEveryOne }),
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

  //* Lista todos los grupos donde está conectada la instancia
  async fetchGroups(): Promise<EvolutionGroup[]> {
    const url = `${this.baseUrl}/group/fetchAllGroups/${this.instance}?getParticipants=false`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { apikey: this.apiKey },
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
        headers: { apikey: this.apiKey },
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
