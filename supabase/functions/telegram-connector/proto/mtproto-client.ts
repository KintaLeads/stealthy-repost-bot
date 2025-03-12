
/**
 * MTProto client implementation for Telegram API
 * Using GramJS for Deno
 */
import { TelegramClient } from "https://esm.sh/telegram@2.19.10";
import { StringSession } from "https://esm.sh/telegram/sessions";
import { MTProtoInterface, MTProtoOptions } from "./interfaces.ts";
import * as Auth from "./auth-methods.ts";
import * as Messages from "./message-methods.ts";
import { validateApiId, validateApiHash } from "./utils.ts";
import { initializeTelegramClient, exportClientSession } from "./client-initializer.ts";
import { connectToTelegram, disconnectFromTelegram } from "./connection-handler.ts";
import { validateCredentials } from "./credential-validator.ts";

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
    
    // Initialize the client
    this.initClient();
  }
  
  /**
   * Initialize the Telegram client
   */
  private initClient() {
    try {
      console.log(`==== TELEGRAM CLIENT INITIALIZATION ====`);
      
      // Final validation before creating the client
      if (!this.apiId || isNaN(this.apiId) || this.apiId <= 0) {
        throw new Error(`Invalid API ID before client creation: ${this.apiId}`);
      }
      
      if (!this.apiHash || this.apiHash.trim() === '') {
        throw new Error(`Invalid API Hash before client creation: ${this.apiHash}`);
      }
      
      // Initialize client using the client initializer
      const { client, stringSession } = initializeTelegramClient(
        this.apiId,
        this.apiHash,
        this.session
      );
      
      this.client = client;
      this.stringSession = stringSession;
      
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
    if (!this.client || !this.stringSession) {
      throw new Error("Client not initialized");
    }
    
    return exportClientSession(this.stringSession);
  }
  
  /**
   * Connect to Telegram servers
   */
  private async connect(): Promise<void> {
    if (this.connected) return;
    
    try {
      if (!this.client) {
        this.initClient();
      }
      
      await connectToTelegram(this.client!);
      this.connected = true;
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
    if (!this.connected || !this.client) return;
    
    await disconnectFromTelegram(this.client);
    this.connected = false;
  }
  
  /**
   * Validate the API credentials
   */
  async validateCredentials(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.client) {
        this.initClient();
      }
      
      return await validateCredentials(this.client!);
    } catch (error) {
      console.error("Error validating credentials:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error during validation" 
      };
    }
  }
}
