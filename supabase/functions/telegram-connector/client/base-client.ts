
// Base client class with common functionality for MTProto
import { MTProto } from "../proto/index.ts";
import { AuthState } from "./types.ts";
import { ClientConfig, validateClientConfig } from "./config/client-config.ts";
import { initializeMTProto, callMTProtoMethod } from "./utils/mtproto-utils.ts";
import { checkAuthentication } from "./utils/session-manager.ts";

export abstract class BaseClient {
  protected accountId: string;
  protected apiId: string;
  protected apiHash: string;
  protected phoneNumber: string;
  protected client: MTProto | null = null;
  protected authState: AuthState = "unauthorized";
  
  constructor(apiId: string | number, apiHash: string, phoneNumber: string, accountId: string) {
    console.log(`[BASE-CLIENT] Constructor received:
    - apiId: ${apiId} (${typeof apiId})
    - apiHash: ${apiHash ? apiHash.substring(0, 3) + '...' : 'undefined'} (${typeof apiHash})
    - phoneNumber: ${phoneNumber ? phoneNumber.substring(0, 4) + '****' : 'none'} (${typeof phoneNumber})
    - accountId: ${accountId} (${typeof accountId})`);
    
    // Convert apiId to string if needed
    const apiIdStr = String(apiId || "");
    
    // Create and validate the configuration
    const config: ClientConfig = {
      apiId: apiIdStr.trim(),
      apiHash: apiHash ? apiHash.trim() : '',
      phoneNumber: phoneNumber ? phoneNumber.trim() : '',
      accountId
    };
    
    // Validate the configuration
    validateClientConfig(config);
    
    // Store the configuration values
    this.apiId = config.apiId;
    this.apiHash = config.apiHash;
    this.phoneNumber = config.phoneNumber;
    this.accountId = config.accountId;
    
    console.log(`[BASE-CLIENT] Initialized with:
      - API ID: "${this.apiId}" (${typeof this.apiId}, length: ${this.apiId.length})
      - API Hash: "${this.apiHash.substring(0, 3)}..." (${typeof this.apiHash}, length: ${this.apiHash.length})
      - Phone Number: "${this.phoneNumber ? this.phoneNumber.substring(0, 4) + '****' : 'none'}"
      - Account ID: "${this.accountId}"`);
  }
  
  /**
   * Initialize MTProto client
   * @returns The initialized client
   */
  protected initMTProto(): MTProto {
    // Convert apiId to numeric value before initializing
    console.log(`[BASE-CLIENT] initMTProto: Converting apiId "${this.apiId}" (${typeof this.apiId}) to number`);
    
    const numericApiId = parseInt(this.apiId, 10);
    if (isNaN(numericApiId) || numericApiId <= 0) {
      console.error(`[BASE-CLIENT] Invalid API ID when initializing MTProto: ${this.apiId} (${typeof this.apiId})`);
      throw new Error(`API ID must be a valid positive number, got: ${this.apiId}`);
    }
    
    console.log(`[BASE-CLIENT] Calling initializeMTProto with:
      - apiId: ${numericApiId} (${typeof numericApiId})
      - apiHash: ${this.apiHash.substring(0, 3)}... (${typeof this.apiHash})`);
    
    this.client = initializeMTProto(numericApiId, this.apiHash);
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
   * Check if the client is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      if (!this.client) {
        // Initialize the client if it doesn't exist
        this.client = this.initMTProto();
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
