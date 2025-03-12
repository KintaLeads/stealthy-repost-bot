// Authentication implementation for Telegram client
import { BaseTelegramImplementation } from "./base-implementation.ts";
import { AuthClient } from "../auth-client.ts";
import { AuthState } from "../types.ts";

export class AuthImplementation extends BaseTelegramImplementation {
  private authClient: AuthClient | null = null;
  
  constructor(apiId: string, apiHash: string, phoneNumber: string, accountId: string, sessionString: string = "") {
    super(apiId, apiHash, phoneNumber, accountId, sessionString);
    console.log("Creating AuthImplementation");
  }
  
  // Method to get auth client (lazy loading)
  async getAuthClient(): Promise<AuthClient> {
    if (!this.authClient) {
      // Validate credentials again before creating the client
      if (!this.apiId || !this.apiHash) {
        console.error("Cannot create AuthClient: Missing API credentials");
        throw new Error("API ID and Hash must be provided to create AuthClient");
      }
      
      this.authClient = new AuthClient(
        this.apiId, 
        this.apiHash, 
        this.phoneNumber, 
        this.accountId, 
        this.sessionString
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
  async connect(): Promise<{ success: boolean; codeNeeded?: boolean; phoneCodeHash?: string; error?: string; session?: string; _testCode?: string; user?: any }> {
    const authClient = await this.getAuthClient();
    return authClient.startAuthentication();
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
      
      console.log("AuthImplementation disconnected");
    } catch (error) {
      console.error("Error disconnecting AuthImplementation:", error);
    }
  }
}
