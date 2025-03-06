
import { StringSession } from "npm:telegram@2.26.22/sessions/index.js";
import { TelegramClient } from "npm:telegram@2.26.22/client/index.js";
import { BaseTelegramClient } from "./base-client.ts";

// Validation client for verifying Telegram API credentials
export class ValidationClient extends BaseTelegramClient {
  private client: TelegramClient;
  
  constructor(apiId: string, apiHash: string, phoneNumber: string, accountId: string, sessionString: string = "") {
    super(apiId, apiHash, phoneNumber, accountId, sessionString);
    this.client = new TelegramClient(this.stringSession, Number(this.apiId), this.apiHash, {
      connectionRetries: 3,
      baseLogger: console,
    });
  }
  
  // Connect without full authentication (just to validate credentials)
  async connect(): Promise<{ success: boolean, error?: string }> {
    try {
      console.log(`Attempting to validate credentials: API ID: ${this.apiId}, API Hash: ${this.maskApiHash(this.apiHash)}, Phone: ${this.maskPhone(this.phoneNumber)}`);
      
      // Just attempt to connect without completing the login flow
      await this.client.connect();
      console.log("Connection successful, credentials are valid");
      return { success: true };
    } catch (error) {
      console.error("Error validating credentials:", error);
      return { success: false, error: error.message };
    }
  }
  
  // Main validation method
  async validateCredentials(): Promise<{ success: boolean, error?: string }> {
    try {
      console.log("Validating Telegram credentials...");
      return await this.connect();
    } catch (error) {
      console.error("Validation failed:", error.message);
      return { success: false, error: error.message };
    }
  }
}
