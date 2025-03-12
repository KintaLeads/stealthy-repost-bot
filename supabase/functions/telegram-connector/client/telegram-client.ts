
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
    // Enhanced validation to catch issues early
    if (!apiId || apiId === "undefined" || apiId === "null" || apiId.trim() === "") {
      console.error("Invalid API ID provided in TelegramClientImplementation constructor:", apiId);
      throw new Error("API ID cannot be empty or undefined");
    }
    
    if (!apiHash || apiHash === "undefined" || apiHash === "null" || apiHash.trim() === "") {
      console.error("Invalid API Hash provided in TelegramClientImplementation constructor");
      throw new Error("API Hash cannot be empty or undefined");
    }
    
    // Store the trimmed values to prevent whitespace issues
    this.apiId = apiId.trim();
    this.apiHash = apiHash.trim();
    this.phoneNumber = phoneNumber;
    this.accountId = accountId;
    this.sessionString = sessionString;
    
    console.log("Creating TelegramClientImplementation with MTProto implementation");
    console.log(`API ID: ${this.apiId}, API Hash: ${this.apiHash.substring(0, 3)}..., Phone: ${this.phoneNumber ? this.phoneNumber.substring(0, 4) + '****' : 'Not provided'}`);
    
    // Add numeric validation for API ID
    const numApiId = Number(this.apiId);
    if (isNaN(numApiId) || numApiId <= 0) {
      console.error(`API ID is not a valid number: ${this.apiId}`);
      throw new Error(`API ID must be a positive number, got: ${this.apiId}`);
    }
    
    // Initialize validation client
    this.validationClient = new ValidationClient(this.apiId, this.apiHash, this.phoneNumber, this.accountId, this.sessionString);
  }
  
  // Get API ID
  getApiId(): string {
    return this.apiId;
  }
  
  // Get API Hash 
  getApiHash(): string {
    return this.apiHash;
  }
  
  // Force reinitialization
  async reinitialize(): Promise<void> {
    console.log("Reinitializing client with:", {
      apiId: this.apiId,
      apiHashPrefix: this.apiHash.substring(0, 3) + "...",
      phonePrefix: this.phoneNumber.substring(0, 4) + "****",
      accountId: this.accountId,
      hasSession: !!this.sessionString
    });
    
    // Reset clients
    if (this.authClient) {
      await this.authClient.disconnect();
      this.authClient = null;
    }
    
    if (this.messageClient) {
      await this.messageClient.disconnect();
      this.messageClient = null;
    }
    
    await this.validationClient.disconnect();
    
    // Recreate validation client
    this.validationClient = new ValidationClient(
      this.apiId, 
      this.apiHash, 
      this.phoneNumber, 
      this.accountId, 
      this.sessionString
    );
    
    console.log("Client reinitialized successfully");
  }
  
  // Method to validate credentials
  async validateCredentials(): Promise<{ success: boolean; error?: string }> {
    console.log("Validating credentials with MTProto");
    return this.validationClient.validateCredentials();
  }
  
  // Method to get auth client (lazy loading)
  async getAuthClient(): Promise<AuthClient> {
    if (!this.authClient) {
      // Validate credentials again before creating the client
      if (!this.apiId || !this.apiHash) {
        console.error("Cannot create AuthClient: Missing API credentials");
        throw new Error("API ID and Hash must be provided to create AuthClient");
      }
      
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
  async connect(): Promise<{ success: boolean; codeNeeded?: boolean; phoneCodeHash?: string; error?: string; session?: string; _testCode?: string; user?: any }> {
    const authClient = await this.getAuthClient();
    return authClient.startAuthentication();
  }
  
  // Method to verify code
  async verifyCode(code: string, phone_code_hash: string): Promise<{ success: boolean; error?: string; session?: string; user?: any }> {
    const authClient = await this.getAuthClient();
    return authClient.verifyAuthenticationCode(code, phone_code_hash);
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
  
  // Method to get phone number
  getPhoneNumber(): string {
    return this.phoneNumber;
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
