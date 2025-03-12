
// Base client class that implements MTProto protocol
import { MTProto } from "../proto/mtproto.ts";

export type AuthState = 'not_started' | 'awaiting_verification' | 'authenticated' | 'error';

export class BaseTelegramClient {
  protected apiId: string;
  protected apiHash: string;
  protected phoneNumber: string;
  protected accountId: string;
  protected sessionString: string;
  protected authState: AuthState = 'not_started';
  protected mtproto: MTProto | null = null;
  
  constructor(apiId: string, apiHash: string, phoneNumber: string, accountId: string, sessionString: string = "") {
    console.log("Creating BaseTelegramClient with MTProto implementation");
    
    // Validate inputs
    if (!apiId || apiId === "undefined" || apiId === "null" || apiId.trim() === "") {
      console.error("Invalid API ID provided:", apiId);
      throw new Error("API ID cannot be empty or undefined");
    }
    
    if (!apiHash || apiHash === "undefined" || apiHash === "null" || apiHash.trim() === "") {
      console.error("Invalid API Hash provided:", typeof apiHash);
      throw new Error("API Hash cannot be empty or undefined");
    }
    
    this.apiId = apiId.trim();
    this.apiHash = apiHash.trim();
    this.phoneNumber = phoneNumber || "";
    this.accountId = accountId;
    this.sessionString = sessionString || "";
    
    console.log(`BaseTelegramClient created with: 
      - API ID: ${this.apiId}
      - API Hash: ${this.apiHash.substring(0, 3)}...
      - Phone: ${this.phoneNumber ? this.phoneNumber.substring(0, 4) + '****' : 'Not provided'}
      - Account ID: ${this.accountId}
      - Session: ${this.sessionString ? 'Provided' : 'Not provided'}`);
  }
  
  /**
   * Initialize the MTProto client
   */
  protected async initMTProto(): Promise<MTProto> {
    if (!this.mtproto) {
      console.log("Initializing MTProto client...");
      try {
        // Convert API ID to number and validate
        const apiIdNum = parseInt(this.apiId, 10);
        if (isNaN(apiIdNum) || apiIdNum <= 0) {
          throw new Error(`Invalid API ID format: ${this.apiId}`);
        }
        
        // Validate API Hash format - should be a hex string
        if (!this.apiHash || typeof this.apiHash !== 'string' || this.apiHash.length < 5) {
          throw new Error(`Invalid API Hash format. Length: ${this.apiHash ? this.apiHash.length : 0}`);
        }
        
        // Create MTProto instance with session if available
        this.mtproto = new MTProto({
          apiId: apiIdNum,
          apiHash: this.apiHash,
          storageOptions: {
            session: this.sessionString
          }
        });
        
        console.log("MTProto client initialized successfully");
      } catch (error) {
        console.error("Error initializing MTProto client:", error);
        throw new Error(`Failed to initialize MTProto client: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    return this.mtproto;
  }
  
  /**
   * Gets the current auth state
   */
  getAuthState(): AuthState {
    return this.authState;
  }
  
  /**
   * Get the session string
   */
  getSession(): string {
    return this.sessionString;
  }
  
  /**
   * Save the session string from MTProto
   */
  protected async saveSession(): Promise<void> {
    if (this.mtproto) {
      this.sessionString = await this.mtproto.exportSession();
      console.log("Session saved successfully");
    }
  }
  
  /**
   * Check if the client is authenticated based on session string
   */
  async isAuthenticated(): Promise<boolean> {
    if (!this.sessionString) {
      return false;
    }
    
    try {
      // Initialize MTProto if needed
      const mtproto = await this.initMTProto();
      
      // Try to use getMe method to check if session is valid
      const result = await mtproto.call('users.getMe', {});
      
      const isValid = !!result && !result.error;
      
      if (isValid) {
        this.authState = 'authenticated';
        console.log("Authentication verified with MTProto");
      } else {
        console.log("Session exists but is not valid");
      }
      
      return isValid;
    } catch (error) {
      console.error("Error checking authentication status with MTProto:", error);
      this.authState = 'error';
      return false;
    }
  }
  
  /**
   * Make a secure request to the Telegram API using MTProto
   */
  protected async callMTProto(method: string, params: Record<string, any> = {}): Promise<any> {
    try {
      // Initialize MTProto if needed
      const mtproto = await this.initMTProto();
      
      console.log(`Making MTProto request: ${method}`);
      const result = await mtproto.call(method, params);
      
      if (result.error) {
        throw new Error(`MTProto error: ${result.error.message || JSON.stringify(result.error)}`);
      }
      
      return result;
    } catch (error) {
      console.error(`Error in MTProto request to ${method}:`, error);
      throw error;
    }
  }
  
  /**
   * Clean up resources
   */
  async disconnect(): Promise<void> {
    if (this.mtproto) {
      try {
        // Save session before disconnecting
        await this.saveSession();
        
        // Disconnect MTProto
        await this.mtproto.disconnect();
        console.log("MTProto client disconnected");
      } catch (error) {
        console.error("Error disconnecting MTProto client:", error);
      } finally {
        this.mtproto = null;
      }
    }
  }
}
