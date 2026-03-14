export interface EvolutionInstance {
  id: string;
  name: string;
  connectionStatus: 'open' | 'close' | 'connecting';
  ownerJid: string | null;
  profileName: string | null;
  profilePicUrl: string | null;
  integration: string;
  number: string | null;
}
