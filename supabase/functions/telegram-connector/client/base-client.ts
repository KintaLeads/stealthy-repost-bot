
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
    
    // Validate inputs with more detailed errors
    if (!apiId || apiId === "undefined" || apiId === "null" || apiId.trim() === "") {
      const detailedError = `Invalid API ID provided: "${apiId}", type: ${typeof apiId}, length: ${apiId ? apiId.length : 0}`;
      console.error(detailedError);
      throw new Error(detailedError);
    }
    
    if (!apiHash || apiHash === "undefined" || apiHash === "null" || apiHash.trim() === "") {
      const detailedError = `Invalid API Hash provided: Type: ${typeof apiHash}, Length: ${apiHash ? apiHash.length : 0}`;
      console.error(detailedError);
      throw new Error(detailedError);
    }
    
    // Store trimmed values
    this.apiId = apiId.trim();
    this.apiHash = apiHash.trim();
    this.phoneNumber = phoneNumber ? phoneNumber.trim() : "";
    this.accountId = accountId;
    this.sessionString = sessionString || "";
    
    // Log the values we've stored
    console.log(`BaseTelegramClient created with:
      - API ID: ${this.apiId} 
      - API Hash: ${this.apiHash.substring(0, 3)}... (length: ${this.apiHash.length})
      - Phone: ${this.phoneNumber ? this.phoneNumber.substring(0, 4) + '****' : 'Not provided'} 
      - Account ID: ${this.accountId}
      - Session: ${this.sessionString ? 'Provided' : 'Not provided'}`);
    
    // Double-check our stored values
    console.log("VALIDATION CHECK - Values after assignment:");
    console.log(`- API ID empty? ${!this.apiId}`);
    console.log(`- API Hash empty? ${!this.apiHash}`);
    console.log(`- API ID is string? ${typeof this.apiId === 'string'}`);
    console.log(`- API Hash is string? ${typeof this.apiHash === 'string'}`);
  }
  
  /**
   * Initialize the MTProto client
   */
  protected async initMTProto(): Promise<MTProto> {
    if (!this.mtproto) {
      console.log("Initializing MTProto client...");
      try {
        // Final validation check before MTProto creation
        if (!this.apiId || this.apiId === "undefined" || this.apiId === "null" || this.apiId.trim() === "") {
          throw new Error(`API ID is invalid: "${this.apiId}"`);
        }
        
        if (!this.apiHash || this.apiHash === "undefined" || this.apiHash === "null" || this.apiHash.trim() === "") {
          throw new Error(`API Hash is invalid: "${this.apiHash.substring(0, 3)}..."`);
        }
        
        // Convert API ID to number and validate
        const apiIdNum = parseInt(this.apiId, 10);
        if (isNaN(apiIdNum) || apiIdNum <= 0) {
          throw new Error(`Invalid API ID format: ${this.apiId}`);
        }
        
        // Validate API Hash format
        if (this.apiHash.length < 5) {
          throw new Error(`Invalid API Hash format. Length: ${this.apiHash.length}`);
        }
        
        console.log(`Creating MTProto with:
          - API ID: ${apiIdNum}
          - API Hash: ${this.apiHash.substring(0, 3)}... (length: ${this.apiHash.length})
          - Session: ${this.sessionString ? 'Available' : 'Not available'}`);
        
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
   * Get the phone number
   */
  getPhoneNumber(): string {
    return this.phoneNumber;
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
