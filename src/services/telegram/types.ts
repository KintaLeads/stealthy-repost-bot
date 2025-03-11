
export interface ConnectionResult {
  codeNeeded: boolean;
  phoneCodeHash?: string;
  success: boolean;
  error?: string | null;
  _testCode?: string; // Add this property to fix the TypeScript error
}

export interface TelegramSession {
  accountId: string;
  sessionString: string;
  createdAt: Date;
}
