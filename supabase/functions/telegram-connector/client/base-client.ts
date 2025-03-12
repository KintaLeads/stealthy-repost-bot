// Base client class with common functionality for MTProto
import { MTProto } from "../proto/mtproto.ts";

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
  
  abstract isAuthenticated(): Promise<boolean>;
  abstract startAuthentication(): Promise<{ success: boolean; codeNeeded?: boolean; phoneCodeHash?: string; error?: string; session?: string; _testCode?: string }>;
  abstract verifyAuthenticationCode(code: string): Promise<{ success: boolean; error?: string; session?: string }>;
}
