// Base client class with common functionality for MTProto
import { MTProto } from "../proto/index.ts";

export type AuthState = "unauthorized" | "awaiting_code" | "authorized";

export abstract class BaseClient {
  protected accountId: string;
  protected apiId: string;
  protected apiHash: string;
  protected phoneNumber: string;
  protected sessionString: string;
  protected client: MTProto | null = null;
  protected authState: AuthState = "unauthorized";
  
  constructor(apiId: string, apiHash: string, phoneNumber: string, accountId: string, sessionString: string = "") {
    // Extra validation to catch any undefined/null/empty values EARLY
    if (!apiId || apiId === 'undefined' || apiId === 'null' || apiId.trim() === '') {
      console.error("CRITICAL ERROR: Invalid API ID in BaseClient:", apiId);
      throw new Error(`API ID cannot be empty or invalid, received: ${JSON.stringify(apiId)}`);
    }
    
    if (!apiHash || apiHash === 'undefined' || apiHash === 'null' || apiHash.trim() === '') {
      console.error("CRITICAL ERROR: Invalid API Hash in BaseClient");
      throw new Error(`API Hash cannot be empty or invalid, received: ${JSON.stringify(apiHash)}`);
    }
    
    // Store trimmed values to avoid whitespace issues
    this.apiId = apiId.trim();
    this.apiHash = apiHash.trim();
    this.phoneNumber = phoneNumber ? phoneNumber.trim() : '';
    this.accountId = accountId;
    this.sessionString = sessionString ? sessionString.trim() : '';
    
    console.log(`BaseClient initialized with:
      - API ID: "${this.apiId}" (${typeof this.apiId}, length: ${this.apiId.length})
      - API Hash: "${this.apiHash.substring(0, 3)}..." (${typeof this.apiHash}, length: ${this.apiHash.length})
      - Phone Number: "${this.phoneNumber ? this.phoneNumber.substring(0, 4) + '****' : 'none'}"
      - Account ID: "${this.accountId}"
      - Session: ${this.sessionString ? 'provided' : 'none'}`);
    
    // Determine initial auth state
    if (this.sessionString) {
      this.authState = "authorized";
    }
  }
  
  /**
   * Initialize MTProto client
   * @returns The initialized client
   */
  protected initMTProto(): MTProto {
    try {
      console.log("=== INITIALIZING MTPROTO CLIENT ===");
      console.log(`Calling MTProto with:
        - API ID: "${this.apiId}" (${typeof this.apiId})
        - API Hash: "${this.apiHash.substring(0, 3)}..." (length: ${this.apiHash.length})
        - Session: ${this.sessionString ? 'provided' : 'none'}`);
      
      // Final validation before creating client
      if (!this.apiId || this.apiId.trim() === '') {
        console.error("FATAL: Empty API ID before creating MTProto");
        throw new Error("API ID cannot be empty");
      }
      
      if (!this.apiHash || this.apiHash.trim() === '') {
        console.error("FATAL: Empty API Hash before creating MTProto");
        throw new Error("API Hash cannot be empty");
      }
      
      // Convert apiId to number one more time
      const numericApiId = parseInt(this.apiId, 10);
      if (isNaN(numericApiId) || numericApiId <= 0) {
        console.error(`FATAL: Invalid API ID format: "${this.apiId}"`);
        throw new Error(`Invalid API ID format: "${this.apiId}"`);
      }
      
      this.client = new MTProto({
        apiId: numericApiId, // Use the numeric version
        apiHash: this.apiHash,
        storageOptions: {
          session: this.sessionString
        }
      });
      
      console.log("MTProto client initialized successfully");
      return this.client;
    } catch (error) {
      console.error("Failed to initialize MTProto client:", error);
      console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace");
      throw new Error(`Failed to initialize MTProto client: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Get the current authentication state
   */
  getAuthState(): AuthState {
    return this.authState;
  }
  
  /**
   * Clean up resources
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.disconnect();
        console.log(`Disconnected ${this.constructor.name} client`);
      } catch (error) {
        console.error(`Error disconnecting ${this.constructor.name} client:`, error);
      } finally {
        this.client = null;
      }
    }
  }
  
  /**
   * Call MTProto method with error handling and retry logic
   */
  protected async callMTProto(method: string, params: any = {}, options: { retries?: number } = {}): Promise<any> {
    if (!this.client) {
      this.client = this.initMTProto();
    }
    
    const retries = options.retries ?? 1;
    let lastError: any = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`Calling MTProto method: ${method} (attempt ${attempt + 1}/${retries + 1})`);
        const result = await this.client.call(method, params);
        console.log(`MTProto method ${method} succeeded`);
        return result;
      } catch (error) {
        console.error(`Error calling MTProto method ${method} (attempt ${attempt + 1}/${retries + 1}):`, error);
        lastError = error;
        
        if (attempt < retries) {
          // Wait a bit before retrying
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // All retries failed
    console.error(`All ${retries + 1} attempts to call ${method} failed`);
    return { error: lastError };
  }
  
  /**
   * Save the current session
   */
  protected async saveSession(): Promise<void> {
    if (!this.client) {
      console.warn("Cannot save session: Client not initialized");
      return;
    }
    
    try {
      // Get the current session string
      this.sessionString = await this.client.exportSession();
      console.log("Session saved successfully (length: " + this.sessionString.length + ")");
    } catch (error) {
      console.error("Error saving session:", error);
      throw new Error(`Failed to save session: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Check if the client is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      if (!this.client) {
        // Initialize the client if it doesn't exist
        this.client = this.initMTProto();
      }
      
      if (!this.sessionString) {
        console.log("No session string available, not authenticated");
        return false;
      }
      
      // Try to get user info to check authentication status
      const result = await this.callMTProto('users.getFullUser', {
        id: {
          _: 'inputUserSelf'
        }
      });
      
      const authenticated = !result.error;
      this.authState = authenticated ? 'authorized' : 'unauthorized';
      
      console.log(`Authentication check: ${authenticated ? 'Authenticated' : 'Not authenticated'}`);
      return authenticated;
    } catch (error) {
      console.error("Error checking authentication status:", error);
      this.authState = 'unauthorized';
      return false;
    }
  }
}
