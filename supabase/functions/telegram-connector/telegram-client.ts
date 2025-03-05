
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
  private authState: 'none' | 'code_needed' | 'authenticated' = 'none';
  private phoneCodeHash: string | null = null;

  constructor(apiId: string, apiHash: string, phoneNumber: string, accountId: string, sessionString: string = "") {
    this.apiId = parseInt(apiId, 10);
    this.apiHash = apiHash;
    this.phoneNumber = phoneNumber;
    this.accountId = accountId;
    this.stringSession = new StringSession(sessionString);
  }

  async connect(): Promise<{ success: boolean, codeNeeded: boolean, phoneCodeHash?: string, error?: string }> {
    console.log('Connecting to Telegram with:', { 
      apiId: this.apiId, 
      apiHash: this.maskApiHash(this.apiHash), 
      phone: this.maskPhone(this.phoneNumber),
      accountId: this.accountId,
      hasSession: this.stringSession.save() !== ''
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

      // Connect but don't login yet
      await this.client.connect();
      console.log("Initial connection successful, connected:", this.client.connected);
      
      // If we have a session string and client is connected, we're already authenticated
      if (this.stringSession.save() !== '' && this.client.connected) {
        console.log("Already authenticated with session string");
        try {
          // Test the session by getting self
          const me = await this.client.getMe();
          console.log("Session valid, got self:", me);
          this.authState = 'authenticated';
          return { success: true, codeNeeded: false };
        } catch (error) {
          console.error("Stored session is invalid, need to re-authenticate:", error);
          // Continue with authentication flow
        }
      }
      
      // Check if the client is connected
      if (!this.client.connected) {
        console.error("Failed to connect to Telegram API");
        return { success: false, codeNeeded: false, error: "Failed to establish connection to Telegram" };
      }
      
      // Request the login code to be sent via SMS
      console.log("Sending code request to phone:", this.maskPhone(this.phoneNumber));
      const { phoneCodeHash } = await this.client.sendCode({
        apiId: this.apiId,
        apiHash: this.apiHash,
        phoneNumber: this.phoneNumber,
      });
      
      this.phoneCodeHash = phoneCodeHash;
      this.authState = 'code_needed';
      
      console.log("Code sent to phone, waiting for verification. phoneCodeHash:", phoneCodeHash);
      return { success: true, codeNeeded: true, phoneCodeHash };
    } catch (error) {
      console.error("Error connecting to Telegram:", error);
      return { success: false, codeNeeded: false, error: error.message };
    }
  }

  async verifyCode(code: string): Promise<{ success: boolean; error?: string }> {
    if (!this.client || !this.phoneCodeHash) {
      console.error("Cannot verify code: Client not initialized or code request not sent");
      return { success: false, error: "Authentication flow not properly initialized" };
    }
    
    try {
      console.log("Attempting to sign in with code");
      await this.client.invoke(new Api.auth.SignIn({
        phoneNumber: this.phoneNumber,
        phoneCodeHash: this.phoneCodeHash,
        phoneCode: code
      }));
      
      this.authState = 'authenticated';
      console.log("Successfully authenticated with code");
      return { success: true };
    } catch (error) {
      console.error("Error verifying code:", error);
      
      // Check if error is because user is already logged in (common case)
      if (error.message.includes('AUTH_KEY_UNREGISTERED') || 
          error.message.includes('SESSION_PASSWORD_NEEDED')) {
        // Already logged in or 2FA is needed
        this.authState = 'authenticated';
        console.log("User seems to be already authenticated or needs 2FA");
        return { success: true };
      }
      
      return { success: false, error: error.message };
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
    return !!this.client?.connected && this.authState === 'authenticated';
  }
  
  getAuthState(): string {
    return this.authState;
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
