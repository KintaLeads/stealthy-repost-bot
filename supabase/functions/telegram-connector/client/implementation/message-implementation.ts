
// Message implementation for Telegram client
import { BaseTelegramImplementation } from "./base-implementation.ts";
import { MessageClient } from "../message-client.ts";

export class MessageImplementation extends BaseTelegramImplementation {
  private messageClient: MessageClient | null = null;
  
  constructor(apiId: string, apiHash: string, phoneNumber: string, accountId: string, sessionString: string = "") {
    super(apiId, apiHash, phoneNumber, accountId, sessionString);
    console.log("Creating MessageImplementation");
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
  
  // Clean up resources
  async disconnect(): Promise<void> {
    try {
      // Disconnect message client if exists
      if (this.messageClient) {
        await this.messageClient.disconnect();
        this.messageClient = null;
      }
      
      // Disconnect validation client (handled by parent)
      await this.validationClient.disconnect();
      
      console.log("MessageImplementation disconnected");
    } catch (error) {
      console.error("Error disconnecting MessageImplementation:", error);
    }
  }
}
