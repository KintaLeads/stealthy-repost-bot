/**
 * MTProto implementation for Telegram API
 * Using GramJS for Deno
 */
import { Api, TelegramClient } from "https://esm.sh/telegram@2.19.10";
import { StringSession } from "https://esm.sh/telegram/sessions";

interface MTProtoOptions {
  apiId: number;
  apiHash: string;
  storageOptions: {
    session?: string;
  };
}

export class MTProto {
  private apiId: number;
  private apiHash: string;
  private session: string;
  private connected: boolean = false;
  private client: TelegramClient | null = null;
  private stringSession: StringSession | null = null;
  private lastPhoneCodeHash: string | null = null;
  
  constructor(options: MTProtoOptions) {
    console.log("==== MTPROTO INITIALIZATION ====");
    console.log(`Constructor called with options: apiId=${options.apiId}, apiHash=${options.apiHash ? `${options.apiHash.substring(0, 3)}... (${options.apiHash.length} chars)` : 'undefined'}`);
    
    // Validate API ID
    if (!options.apiId || options.apiId === undefined || options.apiId === null) {
      console.error(`CRITICAL ERROR: API ID is invalid: "${options.apiId}"`);
      throw new Error(`API ID cannot be undefined or null, received: ${options.apiId}`);
    }
    
    // Validate API Hash
    if (!options.apiHash || options.apiHash === undefined || options.apiHash === null || options.apiHash.trim() === '') {
      console.error(`CRITICAL ERROR: API Hash is invalid: "${options.apiHash}"`);
      throw new Error(`API Hash cannot be undefined, null or empty, received: ${options.apiHash}`);
    }
    
    // Convert apiId to number if it's a string
    let numericApiId: number;
    if (typeof options.apiId === 'string') {
      console.log(`API ID is a string (${options.apiId}), converting to number`);
      numericApiId = parseInt(options.apiId, 10);
      
      if (isNaN(numericApiId)) {
        console.error(`Failed to parse API ID string "${options.apiId}" to number`);
        throw new Error(`Invalid API ID: "${options.apiId}". Could not convert to number.`);
      }
    } else {
      numericApiId = options.apiId;
    }
    
    // Final validation
    if (isNaN(numericApiId) || numericApiId <= 0) {
      console.error(`Invalid API ID: ${numericApiId}`);
      throw new Error(`Invalid API ID: ${numericApiId}. Must be a positive number.`);
    }
    
    // Store validated values
    this.apiId = numericApiId;
    this.apiHash = options.apiHash.trim();
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
          return await this.handleCheckPhone(params.phone || "");
        case 'auth.sendCode':
          return await this.handleSendCode(params.phone || "");
        case 'auth.signIn':
          return await this.handleSignIn(params.phone || "", params.phone_code_hash || "", params.phone_code || "");
        case 'users.getMe':
          return await this.handleGetMe();
        case 'channels.getChannels':
          return await this.handleGetChannels(params.id || []);
        case 'messages.getHistory':
          return await this.handleGetHistory(params.peer || {}, params.limit || 10);
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
   * Handle auth.checkPhone request
   */
  private async handleCheckPhone(phone: string): Promise<any> {
    console.log(`Checking phone ${phone}...`);
    
    // Validate phone number format
    if (!phone || !/^\+[1-9]\d{7,14}$/.test(phone)) {
      console.error("Invalid phone number format:", phone);
      return { error: { code: 400, message: "Invalid phone number format" } };
    }
    
    try {
      // Make actual API call to Telegram using the GramJS client
      const result = await this.client.invoke({
        _: "auth.checkPhone",
        phone_number: phone.replace('+', '')
      });
      
      console.log("Phone check result:", result);
      return result;
    } catch (error) {
      console.error("Error checking phone:", error);
      throw error;
    }
  }
  
  /**
   * Handle auth.sendCode request
   */
  private async handleSendCode(phone: string): Promise<any> {
    console.log(`Sending code to ${phone}...`);
    
    // Validate phone number format
    if (!phone || !/^\+[1-9]\d{7,14}$/.test(phone)) {
      console.error("Invalid phone number format:", phone);
      return { error: { code: 400, message: "Invalid phone number format" } };
    }
    
    try {
      // Make actual API call to Telegram using the GramJS client
      const result = await this.client.invoke({
        _: "auth.sendCode",
        phone_number: phone.replace('+', ''),
        api_id: this.apiId,
        api_hash: this.apiHash,
        settings: {
          _: "codeSettings",
          allow_flashcall: false,
          current_number: true,
          allow_app_hash: true,
        }
      });
      
      console.log("Send code result:", result);
      
      // Store the phone code hash for later verification
      this.lastPhoneCodeHash = result.phone_code_hash;
      
      return {
        type: result.type,
        phone_code_hash: result.phone_code_hash,
        timeout: result.timeout || 120
      };
    } catch (error) {
      console.error("Error sending code:", error);
      throw error;
    }
  }
  
  /**
   * Handle auth.signIn request
   */
  private async handleSignIn(phone: string, phoneCodeHash: string, phoneCode: string): Promise<any> {
    console.log(`Signing in ${phone} with code ${phoneCode} and hash ${phoneCodeHash}...`);
    
    // Validate inputs
    if (!phone || !phoneCodeHash || !phoneCode) {
      console.error("Missing required parameters for sign in");
      return { error: { code: 400, message: "Missing required parameters" } };
    }
    
    try {
      // Make actual API call to Telegram using the GramJS client
      const result = await this.client.invoke({
        _: "auth.signIn",
        phone_number: phone.replace('+', ''),
        phone_code_hash: phoneCodeHash,
        phone_code: phoneCode
      });
      
      console.log("Sign in result:", result);
      
      // Reset the phone code hash after a successful sign-in
      this.lastPhoneCodeHash = null;
      
      return result;
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  }
  
  /**
   * Handle users.getMe request
   */
  private async handleGetMe(): Promise<any> {
    console.log("Getting user information...");
    
    try {
      // Make actual API call to Telegram using the GramJS client
      const result = await this.client.invoke({
        _: "users.getFullUser",
        id: {
          _: "inputUserSelf"
        }
      });
      
      console.log("Get me result:", result);
      return result;
    } catch (error) {
      console.error("Error getting user info:", error);
      throw error;
    }
  }
  
  /**
   * Handle channels.getChannels request
   */
  private async handleGetChannels(ids: any[]): Promise<any> {
    console.log(`Getting channels for IDs: ${JSON.stringify(ids)}...`);
    
    try {
      // Convert ids to InputChannel format
      const inputChannels = ids.map(id => ({
        _: "inputChannel",
        channel_id: typeof id === 'string' ? parseInt(id, 10) : id,
        access_hash: 0  // We would need to store this from when the channel was retrieved
      }));
      
      // Make actual API call to Telegram using the GramJS client
      const result = await this.client.invoke({
        _: "channels.getChannels",
        id: inputChannels
      });
      
      console.log("Get channels result:", result);
      return result;
    } catch (error) {
      console.error("Error getting channels:", error);
      throw error;
    }
  }
  
  /**
   * Handle messages.getHistory request
   */
  private async handleGetHistory(peer: any, limit: number): Promise<any> {
    console.log(`Getting message history for peer: ${JSON.stringify(peer)}, limit: ${limit}...`);
    
    try {
      // Convert peer to InputPeer format
      const inputPeer = {
        _: "inputPeerChannel",
        channel_id: peer.channelId,
        access_hash: peer.accessHash || 0
      };
      
      // Make actual API call to Telegram using the GramJS client
      const result = await this.client.invoke({
        _: "messages.getHistory",
        peer: inputPeer,
        offset_id: 0,
        offset_date: 0,
        add_offset: 0,
        limit: limit,
        max_id: 0,
        min_id: 0,
        hash: 0
      });
      
      console.log(`Returning ${result.messages.length} messages`);
      return result;
    } catch (error) {
      console.error("Error getting message history:", error);
      throw error;
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
