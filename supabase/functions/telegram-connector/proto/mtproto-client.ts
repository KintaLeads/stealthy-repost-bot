/**
 * MTProto client implementation for Telegram API
 * Using GramJS for Deno
 */
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
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
    console.log(`[MTPROTO-CLIENT] Constructor received:
      - apiId: ${options.apiId} (${typeof options.apiId})
      - apiHash: ${options.apiHash ? options.apiHash.substring(0, 3) + '...' : 'undefined'} (${typeof options.apiHash})
      - session: ${options.storageOptions.session ? `length: ${options.storageOptions.session.length}` : 'empty string'} (${typeof options.storageOptions.session})`);
    
    // Convert API ID to string first, then validate and convert to number
    const apiIdStr = String(options.apiId || "");
    
    // Validate and convert API ID to number
    try {
      this.apiId = validateApiId(apiIdStr);
      console.log(`[MTPROTO-CLIENT] apiId validated: ${this.apiId} (${typeof this.apiId})`);
    } catch (error) {
      console.error(`[MTPROTO-CLIENT] API ID validation failed: ${error.message}`);
      throw error;
    }
    
    // Validate and store API Hash
    try {
      this.apiHash = validateApiHash(options.apiHash);
      console.log(`[MTPROTO-CLIENT] apiHash validated: ${this.apiHash.substring(0, 3)}... (${typeof this.apiHash})`);
    } catch (error) {
      console.error(`[MTPROTO-CLIENT] API Hash validation failed: ${error.message}`);
      throw error;
    }
    
    // CRITICAL FIX: Never use "[NONE]" as a session, only empty string
    this.session = options.storageOptions.session && 
                  options.storageOptions.session !== "[NONE]" ? 
                  options.storageOptions.session.trim() : "";
    
    console.log(`[MTPROTO-CLIENT] MTProto initialized with:
      - API ID: ${this.apiId} (${typeof this.apiId})
      - API Hash: ${this.apiHash.substring(0, 3)}... (length: ${this.apiHash.length})
      - Session: ${this.session ? `length: ${this.session.length}` : 'empty string'}`);
    
    // Initialize the client
    this.initClient();
  }
  
  private initClient() {
    try {
      console.log(`==== TELEGRAM CLIENT INITIALIZATION ====`);
      
      // Final validation before creating the client
      if (!this.apiId || isNaN(this.apiId) || this.apiId <= 0) {
        console.error(`[MTPROTO-CLIENT] Invalid API ID before client creation: ${this.apiId} (${typeof this.apiId})`);
        throw new Error(`Invalid API ID before client creation: ${this.apiId}`);
      }
      
      if (!this.apiHash || this.apiHash.trim() === '') {
        console.error(`[MTPROTO-CLIENT] Invalid API Hash before client creation: ${this.apiHash} (${typeof this.apiHash})`);
        throw new Error(`Invalid API Hash before client creation: ${this.apiHash}`);
      }
      
      // Log right before client initialization
      console.log(`[MTPROTO-CLIENT] Calling initializeTelegramClient with:
        - apiId: ${this.apiId} (${typeof this.apiId})
        - apiHash: ${this.apiHash.substring(0, 3)}... (${typeof this.apiHash})
        - session: ${this.session ? `length: ${this.session.length}` : 'empty string'} (${typeof this.session})`);
      
      // Initialize client using the client initializer with proper session handling
      const { client, stringSession } = initializeTelegramClient(
        this.apiId,
        this.apiHash,
        this.session  // Already cleaned in constructor
      );
      
      this.client = client;
      this.stringSession = stringSession;
      
      console.log("[MTPROTO-CLIENT] Telegram client initialized successfully");
      
      // Debug the type of stringSession to verify it's correct
      console.log(`[MTPROTO-CLIENT] StringSession type: ${this.stringSession ? this.stringSession.constructor.name : 'null'}`);
      
      // CRITICAL FIX: Final validation of stringSession
      if (!this.stringSession || typeof this.stringSession !== 'object') {
        throw new Error("Failed to create a proper StringSession instance");
      }
    } catch (error) {
      console.error("[MTPROTO-CLIENT] Error initializing Telegram client:", error);
      console.error("[MTPROTO-CLIENT] Stack trace:", error instanceof Error ? error.stack : "No stack trace");
      throw error;
    }
  }
  
  async exportSession(): Promise<string> {
    if (!this.client || !this.stringSession) {
      throw new Error("Client not initialized");
    }
    
    try {
      // Explicitly verify stringSession is valid before exporting
      if (!(this.stringSession instanceof StringSession)) {
        console.error("[MTPROTO-CLIENT] Invalid StringSession object:", this.stringSession);
        throw new Error("Invalid StringSession object during export");
      }
      
      // Log the session export attempt
      console.log(`[MTPROTO-CLIENT] Exporting session from ${this.stringSession.constructor.name}`);
      
      // Export session using the stringSession instance
      const exportedSession = await exportClientSession(this.stringSession);
      console.log(`[MTPROTO-CLIENT] Exported session successfully, length: ${exportedSession.length}`);
      
      return exportedSession;
    } catch (error) {
      console.error("[MTPROTO-CLIENT] Error exporting session:", error);
      throw error;
    }
  }
  
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
  
  async disconnect(): Promise<void> {
    if (!this.connected || !this.client) return;
    
    await disconnectFromTelegram(this.client);
    this.connected = false;
  }
  
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
