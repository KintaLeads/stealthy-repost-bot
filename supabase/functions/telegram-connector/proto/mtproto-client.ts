
/**
 * MTProto client implementation for Telegram API
 * Using GramJS for Deno
 */
import { Api, TelegramClient } from "https://esm.sh/telegram@2.19.10";
import { StringSession } from "https://esm.sh/telegram/sessions";
import { MTProtoInterface, MTProtoOptions } from "./interfaces.ts";
import * as Auth from "./auth-methods.ts";
import * as Messages from "./message-methods.ts";
import { validateApiId, validateApiHash } from "./utils.ts";

export class MTProtoClient implements MTProtoInterface {
  private apiId: number;
  private apiHash: string;
  private session: string;
  private connected: boolean = false;
  private client: TelegramClient | null = null;
  private stringSession: StringSession | null = null;
  private lastPhoneCodeHash: string | null = null;
  
  constructor(options: MTProtoOptions) {
    console.log("==== MTPROTO INITIALIZATION ====");
    
    // Validate and store API ID
    this.apiId = validateApiId(options.apiId);
    
    // Validate and store API Hash
    this.apiHash = validateApiHash(options.apiHash);
    
    // Store session
    this.session = options.storageOptions.session || "";
    
    console.log(`MTProto initialized with API ID: ${this.apiId} and API Hash: ${this.apiHash.substring(0, 3)}... (length: ${this.apiHash.length})`);
    
    // Initialize string session if we have a session
    if (this.session) {
      try {
        this.stringSession = new StringSession(this.session);
        console.log("Session restored successfully");
      } catch (err) {
        console.warn("Failed to restore session:", err);
        this.session = "";
        this.stringSession = new StringSession("");
      }
    } else {
      this.stringSession = new StringSession("");
    }
    
    // Initialize the client
    this.initClient();
  }
  
  /**
   * Initialize the Telegram client
   */
  private initClient() {
    try {
      console.log(`==== TELEGRAM CLIENT INITIALIZATION ====`);
      console.log(`Using apiId: ${this.apiId} (${typeof this.apiId})`);
      console.log(`Using apiHash: ${this.apiHash.substring(0, 3)}... (${typeof this.apiHash}, length: ${this.apiHash.length})`);
      console.log(`Using session: ${this.session ? 'Yes' : 'No'}`);
      
      // Final validation before creating the client
      if (!this.apiId || isNaN(this.apiId) || this.apiId <= 0) {
        throw new Error(`Invalid API ID before client creation: ${this.apiId}`);
      }
      
      if (!this.apiHash || this.apiHash.trim() === '') {
        throw new Error(`Invalid API Hash before client creation: ${this.apiHash}`);
      }
      
      // Create TelegramClient instance with session if available
      console.log("Creating TelegramClient instance...");
      this.client = new TelegramClient({
        apiId: this.apiId,
        apiHash: this.apiHash,
        session: this.stringSession,
        connectionRetries: 3,
        useWSS: true,
        requestRetries: 3,
      });
      
      console.log("Telegram client initialized successfully");
    } catch (error) {
      console.error("Error initializing Telegram client:", error);
      console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace");
      throw error;
    }
  }
  
  /**
   * Export current session as a string
   */
  async exportSession(): Promise<string> {
    if (!this.client) {
      throw new Error("Client not initialized");
    }
    
    try {
      return this.stringSession.save();
    } catch (error) {
      console.error("Error exporting session:", error);
      throw error;
    }
  }
  
  /**
   * Connect to Telegram servers
   */
  private async connect(): Promise<void> {
    if (this.connected) return;
    
    try {
      console.log("Connecting to Telegram servers...");
      
      if (!this.client) {
        this.initClient();
      }
      
      await this.client.connect();
      this.connected = true;
      
      console.log("Connected to Telegram servers successfully");
    } catch (error) {
      console.error("Connection error:", error);
      this.connected = false;
      throw new Error(`Failed to connect to Telegram: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Call a Telegram API method
   */
  async call(method: string, params: Record<string, any> = {}): Promise<any> {
    // Ensure we're connected
    if (!this.connected) {
      await this.connect();
    }
    
    console.log(`Calling method: ${method} with params:`, JSON.stringify(params));
    
    // Handle different methods
    try {
      switch (method) {
        case 'auth.checkPhone':
          return await Auth.handleCheckPhone(this.client, params.phone || "");
        case 'auth.sendCode': {
          const { result, phoneCodeHash } = await Auth.handleSendCode(
            this.client, 
            params.phone || "", 
            this.apiId, 
            this.apiHash
          );
          this.lastPhoneCodeHash = phoneCodeHash;
          return result;
        }
        case 'auth.signIn': {
          const result = await Auth.handleSignIn(
            this.client, 
            params.phone || "", 
            params.phone_code_hash || "", 
            params.phone_code || ""
          );
          // Reset phone code hash after successful sign-in
          this.lastPhoneCodeHash = null;
          return result;
        }
        case 'users.getMe':
          return await Auth.handleGetMe(this.client);
        case 'channels.getChannels':
          return await Messages.handleGetChannels(this.client, params.id || []);
        case 'messages.getHistory':
          return await Messages.handleGetHistory(this.client, params.peer || {}, params.limit || 10);
        default:
          throw new Error(`Method ${method} not implemented`);
      }
    } catch (error) {
      console.error(`Error calling method ${method}:`, error);
      return { 
        error: { 
          code: error instanceof Error && 'code' in error ? (error as any).code : 500,
          message: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }
  
  /**
   * Disconnect from Telegram servers
   */
  async disconnect(): Promise<void> {
    if (!this.connected) return;
    
    try {
      // Disconnect the client
      await this.client.disconnect();
      this.connected = false;
      console.log("Disconnected from Telegram servers");
    } catch (error) {
      console.error("Error disconnecting:", error);
    }
  }
  
  /**
   * Validate the API credentials
   */
  async validateCredentials(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("Validating API credentials...");
      
      // Validate API ID format
      const apiIdNum = parseInt(String(this.apiId), 10);
      if (isNaN(apiIdNum) || apiIdNum <= 0) {
        console.error("Invalid API ID format");
        return { success: false, error: "Invalid API ID format" };
      }
      
      // Validate API Hash format (should be 32 hex chars)
      if (!this.apiHash || !/^[a-f0-9]{32}$/i.test(this.apiHash)) {
        console.error("Invalid API Hash format");
        return { success: false, error: "Invalid API Hash format" };
      }
      
      // Try connecting to verify credentials
      await this.connect();
      
      // If we reach here, credentials are valid
      console.log("API credentials are valid");
      return { success: true };
    } catch (error) {
      console.error("Error validating credentials:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error during validation" 
      };
    }
  }
}
