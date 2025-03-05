// Client implementation for Telegram authentication flow
import { TelegramClient } from "npm:telegram";
import { StringSession } from "npm:telegram/sessions";
import { BaseTelegramClient } from "./base-client.ts";

export class AuthClient extends BaseTelegramClient {
  private client: TelegramClient | null = null;
  private codeRequested: boolean = false;
  private phoneCodeHash: string | null = null;
  
  constructor(apiId: string, apiHash: string, phoneNumber: string, accountId: string, sessionString: string = "") {
    super(apiId, apiHash, phoneNumber, accountId, sessionString);
  }
  
  async connect(): Promise<{ success: boolean, codeNeeded: boolean, phoneCodeHash?: string, error?: string }> {
    try {
      console.log(`[AuthClient] Connecting to Telegram for account: ${this.accountId}`);
      
      this.client = new TelegramClient(this.stringSession, this.apiId, this.apiHash, {
        connectionRetries: 5,
        useWSS: true,
        deviceModel: "Web Client",
        systemVersion: "1.0.0",
        appVersion: "1.0.0",
        initConnectionParams: {
          appId: this.apiId,
          appVersion: "1.0",
          systemVersion: "1.0",
          deviceModel: "Telegram Web App"
        },
      });
      
      await this.client.connect();
      
      if (!this.client.isUserAuthorized()) {
        console.log(`[AuthClient] User not authorized, sending code request for account: ${this.accountId}`);
        
        this.codeRequested = true;
        const result = await this.client.invoke('auth.sendCode', {
          phone_number: this.phoneNumber,
          api_id: this.apiId,
          api_hash: this.apiHash,
          settings: {
            _: 'codeSettings',
          },
        });
        
        this.phoneCodeHash = result.phone_code_hash;
        this.authState = 'code_needed';
        
        console.log(`[AuthClient] Code sent successfully, phoneCodeHash: ${this.phoneCodeHash}`);
        
        return { success: true, codeNeeded: true, phoneCodeHash: this.phoneCodeHash };
      } else {
        console.log(`[AuthClient] User already authorized for account: ${this.accountId}`);
        this.authState = 'authenticated';
        return { success: true, codeNeeded: false };
      }
    } catch (error) {
      console.error(`[AuthClient] Error connecting to Telegram for account ${this.accountId}:`, error);
      this.authState = 'none';
      return { success: false, codeNeeded: false, error: error.message };
    }
  }
  
  async verifyCode(code: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.client) {
        return { success: false, error: "Client not initialized. Call connect() first." };
      }
      
      if (!this.codeRequested || !this.phoneCodeHash) {
        return { success: false, error: "Code was not requested or phoneCodeHash is missing." };
      }
      
      console.log(`[AuthClient] Verifying code for account ${this.accountId}`);
      
      await this.client.invoke('auth.signIn', {
        phone_number: this.phoneNumber,
        phone_code_hash: this.phoneCodeHash,
        phone_code: code,
      });
      
      console.log(`[AuthClient] Code verified successfully for account ${this.accountId}`);
      this.authState = 'authenticated';
      return { success: true };
    } catch (error) {
      console.error(`[AuthClient] Error verifying code for account ${this.accountId}:`, error);
      return { success: false, error: error.message };
    }
  }
  
  getSession(): string {
    return this.stringSession.save();
  }
  
  isConnected(): boolean {
    return !!this.client?.connected;
  }
}
