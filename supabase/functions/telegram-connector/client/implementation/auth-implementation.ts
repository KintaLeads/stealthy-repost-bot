
// Authentication implementation for Telegram client
import { BaseTelegramImplementation } from "./base-implementation.ts";
import { AuthClient } from "../auth-client.ts";
import { AuthState } from "../types.ts";

export class AuthImplementation extends BaseTelegramImplementation {
  private authClient: AuthClient | null = null;
  
  constructor(apiId: string | number, apiHash: string, phoneNumber: string, accountId: string, sessionString: string = "") {
    super(apiId, apiHash, phoneNumber, accountId, sessionString);
    
    // Parse apiId to number if it's a string
    const numericApiId = typeof apiId === 'number' ? apiId : parseInt(String(apiId), 10);
    
    console.log(`[AUTH-IMPLEMENTATION] Creating AuthImplementation with:
      - apiId (original): ${apiId} (${typeof apiId})
      - apiId (numeric): ${numericApiId} (${typeof numericApiId})
      - apiHash: ${apiHash?.substring(0, 3)}... (${typeof apiHash})
      - phoneNumber: ${phoneNumber?.substring(0, 4)}**** (${typeof phoneNumber})
      - accountId: ${accountId} (${typeof accountId})
      - sessionString: ${sessionString ? 'provided' : 'none'} (${typeof sessionString}, length: ${sessionString?.length || 0})`);
  }
  
  // Method to get auth client (lazy loading)
  async getAuthClient(): Promise<AuthClient> {
    if (!this.authClient) {
      console.log(`[AUTH-IMPLEMENTATION] Creating new AuthClient instance`);
      
      // Validate credentials again before creating the client
      if (!this.apiId) {
        console.error("[AUTH-IMPLEMENTATION] Cannot create AuthClient: Missing API ID");
        throw new Error("API ID must be provided to create AuthClient");
      }
      
      if (!this.apiHash) {
        console.error("[AUTH-IMPLEMENTATION] Cannot create AuthClient: Missing API Hash");
        throw new Error("API Hash must be provided to create AuthClient");
      }
      
      if (!this.phoneNumber) {
        console.error("[AUTH-IMPLEMENTATION] Cannot create AuthClient: Missing Phone Number");
        throw new Error("Phone Number must be provided to create AuthClient");
      }
      
      // Convert API ID to numeric
      const numericApiId = parseInt(String(this.apiId), 10);
      if (isNaN(numericApiId) || numericApiId <= 0) {
        console.error("[AUTH-IMPLEMENTATION] Invalid API ID:", this.apiId);
        throw new Error(`API ID must be a valid number, got: ${this.apiId}`);
      }
      
      // Clean session string
      const cleanSessionString = this.sessionString ? this.sessionString.trim() : "";
      
      console.log(`[AUTH-IMPLEMENTATION] Creating AuthClient with:
        - apiId (numeric): ${numericApiId} (${typeof numericApiId})
        - apiHash: ${this.apiHash.substring(0, 3)}... (${typeof this.apiHash})
        - phoneNumber: ${this.phoneNumber?.substring(0, 4)}**** (${typeof this.phoneNumber})
        - accountId: ${this.accountId} (${typeof this.accountId})
        - sessionString: ${cleanSessionString ? `provided (length: ${cleanSessionString.length})` : 'none'}`);
      
      this.authClient = new AuthClient(
        numericApiId, // Pass as number
        this.apiHash, 
        this.phoneNumber, 
        this.accountId, 
        cleanSessionString
      );
    }
    return this.authClient;
  }
  
  // Method to check if authenticated
  async isAuthenticated(): Promise<boolean> {
    const authClient = await this.getAuthClient();
    return authClient.isAuthenticated();
  }
  
  // Method to connect to Telegram
  async connect(): Promise<{ success: boolean; codeNeeded?: boolean; phoneCodeHash?: string; error?: string; session?: string; _testCode?: string; user?: any; details?: any }> {
    console.log(`[AUTH-IMPLEMENTATION] Connect method called`);
    try {
      const authClient = await this.getAuthClient();
      console.log(`[AUTH-IMPLEMENTATION] Got AuthClient instance, calling startAuthentication()`);
      return authClient.startAuthentication();
    } catch (error) {
      console.error(`[AUTH-IMPLEMENTATION] Exception during authentication:`, error);
      return {
        success: false,
        error: `Exception during authentication: ${error instanceof Error ? error.message : String(error)}`,
        details: error instanceof Error ? { name: error.name, stack: error.stack } : { error: String(error) }
      };
    }
  }
  
  // Method to verify code
  async verifyCode(code: string, phone_code_hash: string): Promise<{ success: boolean; error?: string; session?: string; user?: any }> {
    const authClient = await this.getAuthClient();
    return authClient.verifyAuthenticationCode(code, phone_code_hash);
  }
  
  // Method to get auth state
  getAuthState(): string {
    if (this.authClient) {
      return this.authClient.getAuthState();
    }
    return this.validationClient.getAuthState();
  }
  
  // Clean up resources
  async disconnect(): Promise<void> {
    try {
      // Disconnect auth client if exists
      if (this.authClient) {
        await this.authClient.disconnect();
        this.authClient = null;
      }
      
      // Disconnect validation client (handled by parent)
      await this.validationClient.disconnect();
      
      console.log("[AUTH-IMPLEMENTATION] AuthImplementation disconnected");
    } catch (error) {
      console.error("[AUTH-IMPLEMENTATION] Error disconnecting AuthImplementation:", error);
    }
  }
}
