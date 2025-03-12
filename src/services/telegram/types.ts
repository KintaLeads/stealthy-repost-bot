
export interface ConnectionResult {
  codeNeeded: boolean;
  phoneCodeHash?: string;
  success: boolean;
  error?: string | null;
  details?: any; // Add details property to store additional error information
  _testCode?: string; // Property to handle test code in development
}

export interface TelegramSession {
  accountId: string;
  sessionString: string;
  createdAt: Date;
}
