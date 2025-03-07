
// Factory class for creating different types of Telegram clients using MTProto
import { AuthClient } from "./auth-client.ts";
import { MessageClient } from "./message-client.ts";
import { ValidationClient } from "./validation-client.ts";

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
    
    console.log("Creating TelegramClientImplementation with MTProto implementation");
    
    // Initialize validation client
    this.validationClient = new ValidationClient(apiId, apiHash, phoneNumber, accountId, sessionString);
  }
  
  // Method to validate credentials
  async validateCredentials(): Promise<{ success: boolean; error?: string }> {
    console.log("Validating credentials with MTProto");
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
      // Create a new message client
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
  
  // Method to check if authenticated
  async isAuthenticated(): Promise<boolean> {
    const authClient = await this.getAuthClient();
    return authClient.isAuthenticated();
  }
  
  // Method to connect to Telegram
  async connect(): Promise<{ success: boolean; codeNeeded?: boolean; phoneCodeHash?: string; error?: string; session?: string }> {
    const authClient = await this.getAuthClient();
    return authClient.startAuthentication();
  }
  
  // Method to verify code
  async verifyCode(code: string): Promise<{ success: boolean; error?: string; session?: string }> {
    const authClient = await this.getAuthClient();
    return authClient.verifyAuthenticationCode(code);
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
  
  // Method to get session string
  getSession(): string {
    return this.sessionString;
  }
  
  // Method to get auth state
  getAuthState(): string {
    if (this.authClient) {
      return this.authClient.getAuthState();
    }
    return this.validationClient.getAuthState();
  }
  
  // Clean up resources
  async disconnect(): Promise<void> {
    try {
      // Disconnect auth client if exists
      if (this.authClient) {
        await this.authClient.disconnect();
      }
      
      // Disconnect message client if exists
      if (this.messageClient) {
        await this.messageClient.disconnect();
      }
      
      // Disconnect validation client
      await this.validationClient.disconnect();
      
      console.log("All MTProto clients disconnected");
    } catch (error) {
      console.error("Error disconnecting MTProto clients:", error);
    }
  }
}
