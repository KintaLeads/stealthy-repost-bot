
export interface ConnectionResult {
  success: boolean;
  codeNeeded?: boolean;
  phoneCodeHash?: string;
  error?: string;
  _testCode?: string;
  details?: any; // Add this to store additional error details
}

export interface TelegramSession {
  accountId: string;
  sessionString: string;
  createdAt: Date;
}
