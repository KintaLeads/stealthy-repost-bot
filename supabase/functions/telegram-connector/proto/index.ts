
/**
 * MTProto client for Telegram API interaction
 */
import { MTProtoClient } from "./mtproto-client.ts";
import { MTProtoOptions, MTProtoInterface } from "./interfaces.ts";

export class MTProto implements MTProtoInterface {
  private client: MTProtoClient;
  
  constructor(
    apiId: number,
    apiHash: string,
    sessionString: string = ""
  ) {
    // Create the MTProto client with the correct session formatting
    this.client = new MTProtoClient({
      apiId,
      apiHash,
      storageOptions: {
        session: sessionString
      }
    });
  }
  
  async call(method: string, params: Record<string, any> = {}): Promise<any> {
    return await this.client.call(method, params);
  }
  
  async exportSession(): Promise<string> {
    return await this.client.exportSession();
  }
  
  async validateCredentials(): Promise<{ success: boolean; error?: string }> {
    return await this.client.validateCredentials();
  }
}
