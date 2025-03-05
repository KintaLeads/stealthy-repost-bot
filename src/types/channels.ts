// Add MetricsData type if it doesn't already exist in the file
// If it's already defined in another file, you might need to adjust imports instead

export interface MetricsData {
  totalMessages: number;
  processedMessages: number;
  lastUpdate: string;
  uptime: string;
}
export interface ApiAccount {
  id: string;
  createdAt: string;
  apiKey: string;
  apiHash: string;
  phoneNumber: string;
  nickname: string;
  userId: string;
}

export interface ChannelPair {
  id: string;
  createdAt: string;
  sourceChannel: string;
  targetChannel: string;
  accountId: string;
  isActive: boolean;
}
