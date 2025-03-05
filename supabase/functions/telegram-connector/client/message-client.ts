
// Client implementation for Telegram message operations
import { TelegramClient } from "npm:telegram";
import { StringSession } from "npm:telegram/sessions";
import { BaseTelegramClient } from "./base-client.ts";

export class MessageClient extends BaseTelegramClient {
  private client: TelegramClient | null = null;
  
  // Set the client instance from another client class
  setClient(client: TelegramClient): void {
    this.client = client;
    console.log("Message client received TelegramClient instance");
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

  async getMessages(entity: any, options: { limit: number, ids?: number[] }): Promise<any[]> {
    if (!this.client) {
      throw new Error("Client not connected");
    }

    console.log(`Getting messages for entity:`, entity, 'with options:', options);
    try {
      const messages = await this.client.getMessages(entity, {
        limit: options.limit || 5,
        ids: options.ids
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
  
  isConnected(): boolean {
    return !!this.client?.connected;
  }
}
