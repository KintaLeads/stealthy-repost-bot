
export interface Message {
  id: string | number;
  text: string;
  channelName: string;
  timestamp: number;
  sender?: string;
  messageLink?: string;
}

export interface ConnectionResult {
  success: boolean;
  codeNeeded?: boolean;
  phoneCodeHash?: string;
  error?: string;
  _testCode?: string;
  details?: any;
}

export interface TelegramSession {
  accountId: string;
  sessionString: string;
  createdAt: Date;
}
