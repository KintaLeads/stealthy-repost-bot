
// Base telegram client with core properties and utility methods
import { StringSession } from "npm:telegram/sessions";

export abstract class BaseTelegramClient {
  protected apiId: number;
  protected apiHash: string;
  protected phoneNumber: string;
  protected accountId: string;
  protected stringSession: StringSession;
  protected authState: 'none' | 'code_needed' | 'authenticated' = 'none';
  protected phoneCodeHash: string | null = null;

  constructor(apiId: string, apiHash: string, phoneNumber: string, accountId: string, sessionString: string = "") {
    this.apiId = parseInt(apiId, 10);
    this.apiHash = apiHash;
    this.phoneNumber = phoneNumber;
    this.accountId = accountId;
    this.stringSession = new StringSession(sessionString);
    
    console.log(`TelegramClient created for account ${this.accountId} with phone ${this.maskPhone(this.phoneNumber)}`);
    console.log(`Session string provided: ${sessionString ? "Yes (length: " + sessionString.length + ")" : "No"}`);
  }

  // Utility methods for logging sensitive data
  protected maskApiHash(hash: string): string {
    if (hash.length <= 8) return '********';
    return hash.substring(0, 4) + '****' + hash.substring(hash.length - 4);
  }
  
  protected maskPhone(phone: string): string {
    if (phone.length <= 6) return '******';
    return phone.substring(0, 3) + '****' + phone.substring(phone.length - 3);
  }
  
  // Public methods to access properties
  getAccountId(): string {
    return this.accountId;
  }
  
  getAuthState(): string {
    return this.authState;
  }
  
  abstract getSession(): string;
  abstract isConnected(): boolean;
}
