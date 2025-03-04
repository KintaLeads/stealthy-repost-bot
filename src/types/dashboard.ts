
// Interfaces for dashboard components
export interface Message {
  id: string;
  text: string;
  media?: string;
  mediaAlbum?: string[];
  time: string;
  username: string;
  processed: boolean;
  detectedCompetitors?: string[];
  modifiedText?: string;
  finalText?: string;
}

export interface ApiAccount {
  id: string;
  nickname: string;
  apiKey: string;
  apiHash: string;
  phoneNumber: string;
}

export interface MetricsData {
  totalMessages: number;
  processedMessages: number;
  lastUpdate: string;
  uptime: string;
}
