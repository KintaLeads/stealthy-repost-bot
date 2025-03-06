// Base client class that provides common functionality
import { TelegramClient } from 'npm:telegram';
import { StringSession } from 'npm:telegram';
import { Api } from 'npm:telegram';

// Define auth states
export type AuthState = 'not_started' | 'awaiting_verification' | 'authenticated' | 'error';

export class BaseTelegramClient {
  protected client: TelegramClient;
  protected apiId: string;
  protected apiHash: string;
  protected phoneNumber: string;
  protected accountId: string;
  protected sessionString: string;
  protected authState: AuthState = 'not_started';
  
  constructor(apiId: string, apiHash: string, phoneNumber: string, accountId: string, sessionString: string = "") {
    console.log("Creating BaseTelegramClient with Telegram");
    this.apiId = apiId;
    this.apiHash = apiHash;
    this.phoneNumber = phoneNumber;
    this.accountId = accountId;
    this.sessionString = sessionString;
    
    try {
      // Initialize StringSession with the provided session string (if any)
      const stringSession = new StringSession(sessionString);
      
      // Create TelegramClient instance
      this.client = new TelegramClient(
        stringSession, 
        Number(apiId), 
        apiHash, 
        { 
          connectionRetries: 3, 
          baseLogger: { 
            log: console.log, 
            warn: console.warn, 
            error: console.error 
          } 
        }
      );
    } catch (error) {
      console.error("Error initializing TelegramClient:", error);
      throw error;
    }
  }
  
  /**
   * Gets the current auth state
   */
  getAuthState(): AuthState {
    return this.authState;
  }
  
  /**
   * Start the client if not started
   */
  async startClient(): Promise<boolean> {
    try {
      if (!this.client.connected) {
        console.log("Starting TelegramClient...");
        await this.client.connect();
        console.log("TelegramClient connected:", this.client.connected);
      }
      return true;
    } catch (error) {
      console.error("Error starting client:", error);
      this.authState = 'error';
      throw error;
    }
  }
  
  /**
   * Safely disconnect the client
   */
  async safeDisconnect(): Promise<void> {
    try {
      if (this.client.connected) {
        console.log("Disconnecting TelegramClient...");
        await this.client.disconnect();
        console.log("TelegramClient disconnected");
      }
    } catch (error) {
      console.error("Error disconnecting client:", error);
    }
  }
  
  /**
   * Get the session string that can be saved for future use
   */
  getSessionString(): string {
    return this.client.session.save() as string;
  }
  
  /**
   * Check if the client is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      // Make sure the client is started
      await this.startClient();
      
      // Check if we're authorized
      const isAuthorized = await this.client.checkAuthorization();
      
      if (isAuthorized) {
        this.authState = 'authenticated';
      }
      
      return isAuthorized;
    } catch (error) {
      console.error("Error checking authentication status:", error);
      this.authState = 'error';
      return false;
    }
  }
}
