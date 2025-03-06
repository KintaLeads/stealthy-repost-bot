
// Factory class for creating different types of Telegram clients
import { AuthClient } from "./auth-client.ts";
import { MessageClient } from "./message-client.ts";
import { ValidationClient } from "./validation-client.ts";

// Define the allowed client types
type TelegramClientType = "auth" | "message" | "validation";

// Factory class that creates the appropriate client
export class TelegramClientImplementation {
  private apiId: string;
  private apiHash: string;
  private phoneNumber: string;
  private accountId: string;
  private sessionString: string;
  
  constructor(apiId: string, apiHash: string, phoneNumber: string, accountId: string, sessionString: string = "") {
    this.apiId = apiId;
    this.apiHash = apiHash;
    this.phoneNumber = phoneNumber;
    this.accountId = accountId || 'temp';
    this.sessionString = sessionString || '';
  }
  
  // Method to create a client of the specified type
  createClient(type: TelegramClientType) {
    switch (type) {
      case "auth":
        return new AuthClient(this.apiId, this.apiHash, this.phoneNumber, this.accountId, this.sessionString);
      case "message":
        return new MessageClient(this.apiId, this.apiHash, this.phoneNumber, this.accountId, this.sessionString);
      case "validation":
        return new ValidationClient(this.apiId, this.apiHash, this.phoneNumber, this.accountId, this.sessionString);
      default:
        throw new Error(`Invalid client type: ${type}`);
    }
  }
  
  // Check credentials by trying to connect
  async validateCredentials(): Promise<{ success: boolean, error?: string }> {
    try {
      console.log("Creating validation client...");
      const validationClient = this.createClient("validation");
      console.log("Calling validation client validateCredentials method...");
      return await validationClient.validateCredentials();
    } catch (error) {
      console.error("Error validating credentials:", error);
      return { success: false, error: error.message };
    }
  }
  
  // Connect to Telegram (either with existing session or requesting code)
  async connect(): Promise<{ success: boolean, codeNeeded?: boolean, phoneCodeHash?: string, sessionString?: string, error?: string }> {
    try {
      const authClient = this.createClient("auth");
      const result = await authClient.connect();
      
      if (result.success) {
        if (!result.codeNeeded) {
          // If we're already authenticated, get the session string
          const sessionString = authClient.getSession();
          return { ...result, sessionString };
        }
        return result; // Code needed, return phoneCodeHash
      }
      
      return result;
    } catch (error) {
      console.error("Error connecting to Telegram:", error);
      return { success: false, error: error.message };
    }
  }
  
  // Verify a code sent to the user's phone
  async verifyCode(code: string): Promise<{ success: boolean, sessionString?: string, error?: string }> {
    try {
      const authClient = this.createClient("auth");
      const result = await authClient.verifyCode(code);
      
      if (result.success) {
        const sessionString = authClient.getSession();
        return { ...result, sessionString };
      }
      
      return result;
    } catch (error) {
      console.error("Error verifying code:", error);
      return { success: false, error: error.message };
    }
  }
  
  // Fetch messages from a channel
  async fetchChannelMessages(channelUsername: string, limit: number = 10): Promise<{ success: boolean, messages?: any[], error?: string }> {
    try {
      const messageClient = this.createClient("message");
      await messageClient.connect();
      return await messageClient.fetchChannelMessages(channelUsername, limit);
    } catch (error) {
      console.error("Error fetching channel messages:", error);
      return { success: false, error: error.message };
    }
  }
  
  // Repost a message from one channel to another
  async repostMessage(messageId: number, sourceChannel: string, targetChannel: string): Promise<{ success: boolean, error?: string }> {
    try {
      const messageClient = this.createClient("message");
      const connectResult = await messageClient.connect();
      
      if (!connectResult.success) {
        return connectResult;
      }
      
      return await messageClient.repostMessage(messageId, sourceChannel, targetChannel);
    } catch (error) {
      console.error("Error reposting message:", error);
      return { success: false, error: error.message };
    }
  }
  
  // Listen to multiple channels
  async listenToChannels(channels: string[]): Promise<{ success: boolean, error?: string }> {
    try {
      const messageClient = this.createClient("message");
      const connectResult = await messageClient.connect();
      
      if (!connectResult.success) {
        return connectResult;
      }
      
      return await messageClient.listenToChannels(channels);
    } catch (error) {
      console.error("Error setting up channel listeners:", error);
      return { success: false, error: error.message };
    }
  }
}
