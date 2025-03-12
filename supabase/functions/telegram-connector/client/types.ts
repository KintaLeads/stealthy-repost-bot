
// Common types used across client implementations

export interface TelegramClientInterface {
  // Core methods
  getApiId(): string;
  getApiHash(): string;
  getPhoneNumber(): string;
  getSession(): string;
  getAuthState(): string;
  
  // Connection/Authentication methods
  validateCredentials(): Promise<{ success: boolean; error?: string }>;
  reinitialize(): Promise<void>;
  isAuthenticated(): Promise<boolean>;
  connect(): Promise<{ 
    success: boolean; 
    codeNeeded?: boolean; 
    phoneCodeHash?: string; 
    error?: string; 
    session?: string; 
    _testCode?: string; 
    user?: any 
  }>;
  verifyCode(code: string, phone_code_hash: string): Promise<{ 
    success: boolean; 
    error?: string; 
    session?: string; 
    user?: any 
  }>;
  
  // Channel operations
  listenToChannels(channels: string[]): Promise<{ success: boolean; error?: string }>;
  repostMessage(messageId: number, sourceChannel: string, targetChannel: string): Promise<{ 
    success: boolean; 
    error?: string 
  }>;
  
  // Cleanup
  disconnect(): Promise<void>;
}

// Client creation options 
export interface TelegramClientOptions {
  apiId: string;
  apiHash: string;
  phoneNumber: string;
  accountId: string;
  sessionString?: string;
}

// Re-export auth state for use in other files
export type AuthState = "unauthorized" | "awaiting_code" | "authorized";
