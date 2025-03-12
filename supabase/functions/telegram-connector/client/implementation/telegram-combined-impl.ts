
// Combined implementation of the Telegram client interface
import { TelegramClientInterface } from "../types.ts";
import { AuthImplementation } from "./auth-implementation.ts";
import { MessageImplementation } from "./message-implementation.ts";

export class TelegramCombinedImplementation implements TelegramClientInterface {
  private authImpl: AuthImplementation;
  private messageImpl: MessageImplementation;

  constructor(apiId: string, apiHash: string, phoneNumber: string, accountId: string, sessionString: string = "") {
    console.log("Creating TelegramCombinedImplementation");
    
    // Create specialized implementations
    this.authImpl = new AuthImplementation(apiId, apiHash, phoneNumber, accountId, sessionString);
    this.messageImpl = new MessageImplementation(apiId, apiHash, phoneNumber, accountId, sessionString);
  }
  
  // Basic getters delegated to auth implementation
  getApiId(): string {
    return this.authImpl.getApiId();
  }
  
  getApiHash(): string {
    return this.authImpl.getApiHash();
  }
  
  getPhoneNumber(): string {
    return this.authImpl.getPhoneNumber();
  }
  
  getSession(): string {
    return this.authImpl.getSession();
  }
  
  getAuthState(): string {
    return this.authImpl.getAuthState();
  }
  
  // Validation methods
  async validateCredentials(): Promise<{ success: boolean; error?: string }> {
    return this.authImpl.validateCredentials();
  }
  
  // Force reinitialization of both implementations
  async reinitialize(): Promise<void> {
    console.log("Reinitializing client");
    
    // Disconnect both implementations
    await this.disconnect();
    
    // Recreate both implementations
    const apiId = this.getApiId();
    const apiHash = this.getApiHash();
    const phoneNumber = this.getPhoneNumber();
    const accountId = ""; // This is intentionally omitted in the original implementation
    const sessionString = this.getSession();
    
    this.authImpl = new AuthImplementation(apiId, apiHash, phoneNumber, accountId, sessionString);
    this.messageImpl = new MessageImplementation(apiId, apiHash, phoneNumber, accountId, sessionString);
    
    console.log("Client reinitialized successfully");
  }
  
  // Auth methods delegated to auth implementation
  async isAuthenticated(): Promise<boolean> {
    return this.authImpl.isAuthenticated();
  }
  
  async connect(): Promise<{ 
    success: boolean; 
    codeNeeded?: boolean; 
    phoneCodeHash?: string; 
    error?: string; 
    session?: string; 
    _testCode?: string; 
    user?: any 
  }> {
    return this.authImpl.connect();
  }
  
  async verifyCode(code: string, phone_code_hash: string): Promise<{ 
    success: boolean; 
    error?: string; 
    session?: string; 
    user?: any 
  }> {
    return this.authImpl.verifyCode(code, phone_code_hash);
  }
  
  // Message methods delegated to message implementation
  async listenToChannels(channels: string[]): Promise<{ success: boolean; error?: string }> {
    return this.messageImpl.listenToChannels(channels);
  }
  
  async repostMessage(messageId: number, sourceChannel: string, targetChannel: string): Promise<{ 
    success: boolean; 
    error?: string 
  }> {
    return this.messageImpl.repostMessage(messageId, sourceChannel, targetChannel);
  }
  
  // Disconnect both implementations
  async disconnect(): Promise<void> {
    try {
      // Disconnect both implementations
      await Promise.all([
        this.authImpl.disconnect(),
        this.messageImpl.disconnect()
      ]);
      
      console.log("All implementations disconnected");
    } catch (error) {
      console.error("Error disconnecting implementations:", error);
    }
  }
}
