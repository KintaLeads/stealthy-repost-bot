
export interface ConnectionResult {
  codeNeeded: boolean;
  phoneCodeHash?: string;
  success: boolean;
  error?: string | null;
  _testCode?: string; // Property to handle test code in development
}

export interface TelegramSession {
  accountId: string;
  sessionString: string;
  createdAt: Date;
}
