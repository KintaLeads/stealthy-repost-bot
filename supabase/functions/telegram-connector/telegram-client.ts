
// Real Telegram client implementation using GramJS
import { TelegramClient } from "npm:telegram/client";
import { StringSession } from "npm:telegram/sessions";
import { Api } from "npm:telegram/tl";

export class TelegramClientImplementation {
  private apiId: number;
  private apiHash: string;
  private phoneNumber: string;
  private client: TelegramClient | null = null;
  private stringSession: StringSession;
  private accountId: string;

  constructor(apiId: string, apiHash: string, phoneNumber: string, accountId: string, sessionString: string = "") {
    this.apiId = parseInt(apiId, 10);
    this.apiHash = apiHash;
    this.phoneNumber = phoneNumber;
    this.accountId = accountId;
    this.stringSession = new StringSession(sessionString);
  }

  async connect(): Promise<boolean> {
    console.log('Connecting to Telegram with:', { 
      apiId: this.apiId, 
      apiHash: this.maskApiHash(this.apiHash), 
      phone: this.maskPhone(this.phoneNumber),
      accountId: this.accountId
    });
    
    try {
      this.client = new TelegramClient(
        this.stringSession,
        this.apiId,
        this.apiHash,
        {
          connectionRetries: 3,
          useWSS: true,
        }
      );

      await this.client.connect();
      
      // Check if we need to authenticate
      if (!this.client.connected) {
        console.error("Failed to connect to Telegram API");
        return false;
      }
      
      console.log("Connected to Telegram API successfully");
      return true;
    } catch (error) {
      console.error("Error connecting to Telegram:", error);
      return false;
    }
  }

  async getEntity(channelName: string): Promise<any> {
    if (!this.client) {
      throw new Error("Client not connected");
    }

    console.log(`Getting entity for channel: ${channelName}`);
    try {
      // Get the channel entity by username
      const entity = await this.client.getEntity(channelName);
      return entity;
    } catch (error) {
      console.error(`Error getting entity for ${channelName}:`, error);
      throw error;
    }
  }

  async getMessages(entity: any, options: { limit: number }): Promise<any[]> {
    if (!this.client) {
      throw new Error("Client not connected");
    }

    console.log(`Getting messages for entity:`, entity, 'with options:', options);
    try {
      const messages = await this.client.getMessages(entity, {
        limit: options.limit || 5,
      });
      
      return messages;
    } catch (error) {
      console.error("Error getting messages:", error);
      throw error;
    }
  }

  async sendMessage(targetEntity: any, options: { message: string }): Promise<any> {
    if (!this.client) {
      throw new Error("Client not connected");
    }

    console.log(`Sending message to entity:`, targetEntity, 'with options:', options);
    try {
      const result = await this.client.sendMessage(targetEntity, { message: options.message });
      return result;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }
  
  getSession(): string {
    return this.stringSession.save();
  }
  
  getAccountId(): string {
    return this.accountId;
  }
  
  isConnected(): boolean {
    return !!this.client?.connected;
  }
  
  // Helper methods for privacy in logs
  private maskApiHash(hash: string): string {
    if (hash.length <= 8) return '********';
    return hash.substring(0, 4) + '****' + hash.substring(hash.length - 4);
  }
  
  private maskPhone(phone: string): string {
    if (phone.length <= 6) return '******';
    return phone.substring(0, 3) + '****' + phone.substring(phone.length - 3);
  }
}
