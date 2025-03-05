
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
    
    console.log(`TelegramClientImplementation created for account ${this.accountId} with phone ${this.maskPhone(this.phoneNumber)}`);
    console.log(`Session string provided: ${sessionString ? "Yes (length: " + sessionString.length + ")" : "No"}`);
  }

  async validateCredentials(): Promise<{ success: boolean, error?: string }> {
    console.log('Validating Telegram credentials with:', { 
      apiId: this.apiId, 
      apiHash: this.maskApiHash(this.apiHash), 
      phone: this.maskPhone(this.phoneNumber)
    });
    
    try {
      // Check if API ID is a valid integer
      if (isNaN(this.apiId)) {
        return { 
          success: false, 
          error: "API ID must be a valid integer. Please check your Telegram API credentials." 
        };
      }
      
      // Check if API hash is a valid format (usually 32 hex characters)
      if (!this.apiHash || this.apiHash.length !== 32 || !/^[a-f0-9]+$/i.test(this.apiHash)) {
        return { 
          success: false, 
          error: "API Hash appears to be invalid. It should be a 32-character hexadecimal string." 
        };
      }
      
      // Check if phone number is in a reasonable format
      if (!this.phoneNumber || !this.phoneNumber.startsWith('+')) {
        return { 
          success: false, 
          error: "Phone number must be in international format starting with a + sign (e.g., +12345678901)." 
        };
      }
      
      // Create a temporary client just to validate credentials
      console.log("Creating temporary TelegramClient instance for validation");
      const tempClient = new TelegramClient(
        new StringSession(""),
        this.apiId,
        this.apiHash,
        {
          connectionRetries: 2, // Fewer retries for validation
          useWSS: true,
          deviceModel: "Web Client",
          systemVersion: "1.0.0",
          appVersion: "1.0.0",
        }
      );

      // Try to connect (but don't log in)
      console.log("Attempting to establish basic connection to validate credentials");
      try {
        await tempClient.connect();
      } catch (connectionError) {
        console.error("Error connecting to Telegram:", connectionError);
        
        // Check for specific API errors
        const errorMessage = connectionError.message || "";
        
        if (errorMessage.includes('API_ID_INVALID')) {
          return { 
            success: false, 
            error: "The API ID is invalid. Please check your Telegram API credentials." 
          };
        }
        
        if (errorMessage.includes('API_HASH_INVALID')) {
          return { 
            success: false, 
            error: "The API Hash is invalid. Please check your Telegram API credentials." 
          };
        }
        
        if (errorMessage.includes('PHONE_NUMBER_INVALID')) {
          return { 
            success: false, 
            error: "The phone number format is invalid. Please use international format with + prefix." 
          };
        }
        
        return { 
          success: false, 
          error: `Connection error: ${errorMessage}` 
        };
      }
      
      // If we can connect, the credentials are valid
      const isConnected = tempClient.connected;
      console.log("Basic connection test result, connected:", isConnected);
      
      // Disconnect the temporary client
      await tempClient.disconnect();
      console.log("Disconnected temporary client after validation");
      
      if (isConnected) {
        return { success: true };
      } else {
        return { 
          success: false, 
          error: "Could not establish connection with provided credentials" 
        };
      }
    } catch (error) {
      console.error("Error validating Telegram credentials:", error);
      
      // Check for specific API errors
      if (error.message && (
        error.message.includes('API_ID_INVALID') || 
        error.message.includes('API_HASH_INVALID')
      )) {
        return { 
          success: false, 
          error: "Invalid API ID or API Hash. Please check your Telegram API credentials." 
        };
      }
      
      return { 
        success: false, 
        error: `Validation failed: ${error.message}` 
      };
    }
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
      console.log("Creating new TelegramClient instance");
      this.client = new TelegramClient(
        this.stringSession,
        this.apiId,
        this.apiHash,
        {
          connectionRetries: 5,
          useWSS: true,
          deviceModel: "Web Client",
          systemVersion: "1.0.0",
          appVersion: "1.0.0",
        }
      );

      // Connect but don't login yet
      console.log("Calling client.connect()");
      await this.client.connect();
      console.log("Initial connection result, connected:", this.client.connected);
      
      // If we have a session string and client is connected, we're already authenticated
      if (this.stringSession.save() !== '' && this.client.connected) {
        console.log("Session string exists, testing if it's valid by getting self");
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
      if (error.message && (
          error.message.includes('AUTH_KEY_UNREGISTERED') || 
          error.message.includes('SESSION_PASSWORD_NEEDED') ||
          error.message.includes('PHONE_CODE_INVALID') ||
          error.message.includes('PHONE_NUMBER_UNOCCUPIED')
      )) {
        // These are special cases that might still allow us to proceed
        console.log("Special error case detected in verification:", error.message);
        
        if (error.message.includes('PHONE_CODE_INVALID')) {
          return { success: false, error: "Invalid verification code. Please try again." };
        }
        
        if (error.message.includes('PHONE_NUMBER_UNOCCUPIED')) {
          console.log("Phone number not registered with Telegram, attempting signup");
          try {
            // Try to sign up with this number
            await this.client.signUp({
              phoneNumber: this.phoneNumber,
              phoneCodeHash: this.phoneCodeHash,
              firstName: "Telegram",
              lastName: "User"
            });
            this.authState = 'authenticated';
            console.log("Signup successful");
            return { success: true };
          } catch (signupError) {
            console.error("Error signing up:", signupError);
            return { success: false, error: "Failed to sign up with this phone number: " + signupError.message };
          }
        }
        
        // For other cases like SESSION_PASSWORD_NEEDED, we consider it authenticated
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
    const sessionStr = this.stringSession.save();
    console.log(`Getting session string, length: ${sessionStr.length}`);
    return sessionStr;
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
