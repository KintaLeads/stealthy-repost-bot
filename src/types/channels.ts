
export interface ChannelPair {
  id: string;
  sourceChannel: string;
  targetChannel: string;
  targetUsername: string;
  isActive: boolean;
}

export interface ApiAccount {
  id: string;
  nickname: string;
  apiKey: string;
  apiHash: string;
  phoneNumber: string;
  isActive?: boolean;
}

