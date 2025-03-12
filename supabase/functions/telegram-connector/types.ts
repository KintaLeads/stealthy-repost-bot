
export interface ConnectionResult {
  success: boolean;
  codeNeeded?: boolean;
  phoneCodeHash?: string;
  error?: string;
  _testCode?: string;
  details?: any; // For storing additional error details
}

export interface TelegramSession {
  accountId: string;
  sessionString: string;
  createdAt: Date;
}
