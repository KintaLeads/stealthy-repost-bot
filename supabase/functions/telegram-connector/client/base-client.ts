
// Base client class with common functionality for MTProto
import { MTProto } from "../proto/index.ts";
import { AuthState } from "./types/auth-types.ts";
import { ClientConfig, validateClientConfig } from "./config/client-config.ts";
import { initializeMTProto, callMTProtoMethod } from "./utils/mtproto-utils.ts";
import { exportSession, checkAuthentication } from "./utils/session-manager.ts";

export { AuthState };

export abstract class BaseClient {
  protected accountId: string;
  protected apiId: string;
  protected apiHash: string;
  protected phoneNumber: string;
  protected sessionString: string;
  protected client: MTProto | null = null;
  protected authState: AuthState = "unauthorized";
  
  constructor(apiId: string, apiHash: string, phoneNumber: string, accountId: string, sessionString: string = "") {
    // Create and validate the configuration
    const config: ClientConfig = {
      apiId: apiId.trim(),
      apiHash: apiHash.trim(),
      phoneNumber: phoneNumber ? phoneNumber.trim() : '',
      accountId,
      sessionString: sessionString ? sessionString.trim() : ''
    };
    
    // Validate the configuration
    validateClientConfig(config);
    
    // Store the configuration values
    this.apiId = config.apiId;
    this.apiHash = config.apiHash;
    this.phoneNumber = config.phoneNumber;
    this.accountId = config.accountId;
    this.sessionString = config.sessionString;
    
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
    this.client = initializeMTProto(this.apiId, this.apiHash, this.sessionString);
    return this.client;
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
    
    return callMTProtoMethod(this.client, method, params, options);
  }
  
  /**
   * Save the current session
   */
  protected async saveSession(): Promise<void> {
    if (!this.client) {
      console.warn("Cannot save session: Client not initialized");
      return;
    }
    
    this.sessionString = await exportSession(this.client);
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
      
      const authenticated = await checkAuthentication(this.client);
      this.authState = authenticated ? 'authorized' : 'unauthorized';
      
      return authenticated;
    } catch (error) {
      console.error("Error checking authentication status:", error);
      this.authState = 'unauthorized';
      return false;
    }
  }
}
