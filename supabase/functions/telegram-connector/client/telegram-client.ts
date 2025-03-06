
// Factory class for creating different types of Telegram clients
import { AuthClient } from "./auth-client.ts";
import { MessageClient } from "./message-client.ts";
import { ValidationClient } from "./validation-client.ts";
import { BaseTelegramClient } from "./base-client.ts";

// Re-export the AuthState type
export { type AuthState } from "./base-client.ts";

export class TelegramClientImplementation {
  private apiId: string;
  private apiHash: string;
  private phoneNumber: string;
  private accountId: string;
  private sessionString: string;
  private validationClient: ValidationClient;
  private authClient: AuthClient | null = null;
  private messageClient: MessageClient | null = null;

  constructor(apiId: string, apiHash: string, phoneNumber: string, accountId: string, sessionString: string = "") {
    this.apiId = apiId;
    this.apiHash = apiHash;
    this.phoneNumber = phoneNumber;
    this.accountId = accountId;
    this.sessionString = sessionString;
    
    console.log("Creating TelegramClientImplementation with Telegram version 2.26.22");
    
    // Initialize validation client
    this.validationClient = new ValidationClient(apiId, apiHash, phoneNumber, accountId, sessionString);
  }
  
  // Method to validate credentials
  async validateCredentials(): Promise<{ success: boolean; error?: string }> {
    console.log("Validating credentials using Telegram version 2.26.22");
    return this.validationClient.validateCredentials();
  }
  
  // Method to get auth client (lazy loading)
  async getAuthClient(): Promise<AuthClient> {
    if (!this.authClient) {
      this.authClient = new AuthClient(
        this.apiId, 
        this.apiHash, 
        this.phoneNumber, 
        this.accountId, 
        this.sessionString
      );
    }
    return this.authClient;
  }
  
  // Method to get message client (lazy loading)
  async getMessageClient(): Promise<MessageClient> {
    if (!this.messageClient) {
      const authClient = await this.getAuthClient();
      const authState = authClient.getAuthState();
      
      if (authState !== 'authenticated') {
        throw new Error("Cannot create MessageClient: Not authenticated. Please authenticate first.");
      }
      
      // We create the message client with the same session as the auth client
      // to ensure we're using the same authenticated session
      this.messageClient = new MessageClient(
        this.apiId,
        this.apiHash,
        this.phoneNumber,
        this.accountId,
        this.sessionString
      );
    }
    return this.messageClient;
  }
  
  // Method to start auth process
  async startAuthentication(options: Record<string, any> = {}): Promise<{ success: boolean; codeNeeded?: boolean; phoneCodeHash?: string; error?: string; session?: string }> {
    const authClient = await this.getAuthClient();
    return authClient.startAuthentication(options);
  }
  
  // Method to verify auth code
  async verifyAuthenticationCode(code: string, options: Record<string, any> = {}): Promise<{ success: boolean; error?: string; session?: string }> {
    const authClient = await this.getAuthClient();
    return authClient.verifyAuthenticationCode(code, options);
  }
  
  // Method to listen to messages from channels
  async listenToChannels(channels: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      const messageClient = await this.getMessageClient();
      return messageClient.listenToChannels(channels);
    } catch (error) {
      console.error("Error in listenToChannels:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      };
    }
  }
  
  // Method to repost a message from one channel to another
  async repostMessage(messageId: number, sourceChannel: string, targetChannel: string): Promise<{ success: boolean; error?: string }> {
    try {
      const messageClient = await this.getMessageClient();
      return messageClient.repostMessage(messageId, sourceChannel, targetChannel);
    } catch (error) {
      console.error("Error in repostMessage:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      };
    }
  }
}
