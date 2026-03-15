export interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  apikey?: string;
  data: {
    key: {
      remoteJid: string;
      fromMe: boolean;
      id: string;
    };
    message?: {
      conversation?: string;
      extendedTextMessage?: {
        text: string;
      };
    };
    messageType: string;
    messageTimestamp: number;
    pushName?: string;
  };
}
