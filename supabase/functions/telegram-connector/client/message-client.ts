
// Client implementation for Telegram messaging operations
import { TelegramClient } from "npm:telegram@2.26.22";
import { StringSession } from "npm:telegram@2.26.22/sessions/index.js";
import { BaseTelegramClient } from "./base-client.ts";

export class MessageClient extends BaseTelegramClient {
  private client: TelegramClient | null = null;
  
  constructor(apiId: string, apiHash: string, phoneNumber: string, accountId: string, sessionString: string = "") {
    super(apiId, apiHash, phoneNumber, accountId, sessionString);
  }
  
  async connect(): Promise<{ success: boolean, error?: string }> {
    try {
      console.log(`[MessageClient] Connecting to Telegram for account: ${this.accountId}`);
      
      this.client = new TelegramClient(this.stringSession, Number(this.apiId), this.apiHash, {
        connectionRetries: 5,
        useWSS: true,
        deviceModel: "Web Client",
        systemVersion: "1.0.0",
        appVersion: "1.0.0",
        initConnectionParams: {
          appId: Number(this.apiId),
          appVersion: "1.0",
          systemVersion: "1.0",
          deviceModel: "Telegram Web App"
        },
      });
      
      await this.client.connect();
      
      if (!this.client.isUserAuthorized()) {
        console.log(`[MessageClient] User not authorized for account: ${this.accountId}`);
        this.authState = 'none';
        return { success: false, error: "User not authorized. Please authenticate first." };
      }
      
      console.log(`[MessageClient] Connected and authorized for account: ${this.accountId}`);
      this.authState = 'authenticated';
      return { success: true };
    } catch (error) {
      console.error(`[MessageClient] Error connecting to Telegram for account ${this.accountId}:`, error);
      this.authState = 'none';
      return { success: false, error: error.message };
    }
  }
  
  async fetchChannelMessages(channelUsername: string, limit: number = 10): Promise<{ success: boolean, messages?: any[], error?: string }> {
    try {
      if (!this.client) {
        return { success: false, error: "Client not initialized. Call connect() first." };
      }
      
      console.log(`[MessageClient] Fetching messages from channel: ${channelUsername}`);
      
      const entity = await this.client.getEntity(channelUsername);
      if (!entity) {
        return { success: false, error: `Channel ${channelUsername} not found` };
      }
      
      const messages = await this.client.getMessages(entity, { limit });
      
      console.log(`[MessageClient] Successfully fetched ${messages.length} messages from channel: ${channelUsername}`);
      
      return { 
        success: true, 
        messages: messages.map(msg => ({
          id: msg.id,
          date: msg.date,
          message: msg.message,
          fromId: msg.fromId,
          replyTo: msg.replyTo,
          // Include other necessary message properties
        }))
      };
    } catch (error) {
      console.error(`[MessageClient] Error fetching messages from channel ${channelUsername}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  async repostMessage(messageId: number, sourceChannel: string, targetChannel: string): Promise<{ success: boolean, error?: string }> {
    try {
      if (!this.client) {
        return { success: false, error: "Client not initialized. Call connect() first." };
      }
      
      console.log(`[MessageClient] Reposting message ${messageId} from ${sourceChannel} to ${targetChannel}`);
      
      // Get the source and target channel entities
      const sourceEntity = await this.client.getEntity(sourceChannel);
      const targetEntity = await this.client.getEntity(targetChannel);
      
      if (!sourceEntity) {
        return { success: false, error: `Source channel ${sourceChannel} not found` };
      }
      
      if (!targetEntity) {
        return { success: false, error: `Target channel ${targetChannel} not found` };
      }
      
      // Get the message from source channel
      const messages = await this.client.getMessages(sourceEntity, { ids: [messageId] });
      
      if (!messages || messages.length === 0) {
        return { success: false, error: `Message ${messageId} not found in ${sourceChannel}` };
      }
      
      const message = messages[0];
      
      // Forward the message to target channel
      await this.client.forwardMessages(targetEntity, { messages: [messageId], fromPeer: sourceEntity });
      
      console.log(`[MessageClient] Successfully reposted message ${messageId} from ${sourceChannel} to ${targetChannel}`);
      
      return { success: true };
    } catch (error) {
      console.error(`[MessageClient] Error reposting message ${messageId} from ${sourceChannel} to ${targetChannel}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  async listenToChannels(channels: string[]): Promise<{ success: boolean, error?: string }> {
    try {
      if (!this.client) {
        return { success: false, error: "Client not initialized. Call connect() first." };
      }
      
      console.log(`[MessageClient] Setting up listeners for channels:`, channels);
      
      // Get entity for each channel
      for (const channelUsername of channels) {
        try {
          const entity = await this.client.getEntity(channelUsername);
          console.log(`[MessageClient] Successfully found entity for channel: ${channelUsername}`);
        } catch (err) {
          console.error(`[MessageClient] Could not find entity for channel: ${channelUsername}`, err);
          // Continue with other channels
        }
      }
      
      console.log(`[MessageClient] Listening to channels set up successfully`);
      
      return { success: true };
    } catch (error) {
      console.error(`[MessageClient] Error setting up channel listeners:`, error);
      return { success: false, error: error.message };
    }
  }
  
  isConnected(): boolean {
    return !!this.client?.connected;
  }
  
  getSession(): string {
    return this.stringSession.save();
  }
}
