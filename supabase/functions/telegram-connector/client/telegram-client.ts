
// Main Telegram client implementation combining validation, auth, and messaging
import { TelegramClient } from "npm:telegram/client";
import { ValidationClient } from "./validation-client.ts";
import { AuthClient } from "./auth-client.ts";
import { MessageClient } from "./message-client.ts";

export class TelegramClientImplementation {
  private validationClient: ValidationClient;
  private authClient: AuthClient;
  private messageClient: MessageClient;
  private client: TelegramClient | null = null;
  private accountId: string;

  constructor(apiId: string, apiHash: string, phoneNumber: string, accountId: string, sessionString: string = "") {
    this.accountId = accountId;
    
    console.log(`Creating TelegramClientImplementation with accountId: ${accountId}`);
    console.log(`API ID valid: ${!isNaN(parseInt(apiId, 10))}`);
    console.log(`API Hash length: ${apiHash?.length || 0}`);
    console.log(`Phone format valid: ${phoneNumber?.startsWith('+') || false}`);
    console.log(`Session string provided: ${sessionString ? "Yes (length: " + sessionString.length + ")" : "No"}`);
    
    // Initialize specialized clients
    this.validationClient = new ValidationClient(apiId, apiHash, phoneNumber, accountId, sessionString);
    this.authClient = new AuthClient(apiId, apiHash, phoneNumber, accountId, sessionString);
    this.messageClient = new MessageClient(apiId, apiHash, phoneNumber, accountId, sessionString);
  }

  // Validation methods
  async validateCredentials(): Promise<{ success: boolean, error?: string }> {
    console.log(`TelegramClientImplementation.validateCredentials() called for account: ${this.accountId}`);
    return this.validationClient.validateCredentials();
  }

  // Authentication methods
  async connect(): Promise<{ success: boolean, codeNeeded: boolean, phoneCodeHash?: string, error?: string }> {
    return this.authClient.connect();
  }

  async verifyCode(code: string): Promise<{ success: boolean; error?: string }> {
    return this.authClient.verifyCode(code);
  }

  // Message methods
  async getEntity(channelName: string): Promise<any> {
    return this.messageClient.getEntity(channelName);
  }

  async getMessages(entity: any, options: { limit: number, ids?: number[] }): Promise<any[]> {
    return this.messageClient.getMessages(entity, options);
  }

  async sendMessage(targetEntity: any, options: { message: string }): Promise<any> {
    return this.messageClient.sendMessage(targetEntity, options);
  }
  
  // Utility methods
  getSession(): string {
    return this.authClient.getSession();
  }
  
  getAccountId(): string {
    return this.accountId;
  }
  
  isConnected(): boolean {
    return this.authClient.isConnected();
  }
  
  getAuthState(): string {
    return this.authClient.getAuthState();
  }
}
