
/**
 * MTProto client for Telegram API interaction
 */
import { MTProtoClient } from "./mtproto-client.ts";
import { MTProtoOptions, MTProtoInterface } from "./interfaces.ts";

export class MTProto implements MTProtoInterface {
  private client: MTProtoClient;
  
  constructor(
    apiId: number,
    apiHash: string
  ) {
    // Create the MTProto client with minimal settings
    this.client = new MTProtoClient({
      apiId,
      apiHash,
      storageOptions: {
        session: ""  // Always use empty session string
      }
    });
  }
  
  async call(method: string, params: Record<string, any> = {}): Promise<any> {
    return await this.client.call(method, params);
  }
  
  async exportSession(): Promise<string> {
    return ""; // Always return empty string
  }
  
  async validateCredentials(): Promise<{ success: boolean; error?: string }> {
    return await this.client.validateCredentials();
  }
}
