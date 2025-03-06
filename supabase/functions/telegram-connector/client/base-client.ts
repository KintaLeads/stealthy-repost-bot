
// Base class for Telegram client implementations
import { Api, TelegramClient } from 'npm:telegram@2.26.22';
import { StringSession } from 'npm:telegram/sessions@2.26.22';

// Define types for authentication state
export type AuthState = 'unauthenticated' | 'pending' | 'authenticated' | 'error';

// Base class that all other client types will extend
export class BaseTelegramClient {
  protected client: TelegramClient;
  protected apiId: string;
  protected apiHash: string;
  protected phoneNumber: string;
  protected accountId: string;
  protected stringSession: StringSession;
  protected authState: AuthState = 'unauthenticated';

  constructor(apiId: string, apiHash: string, phoneNumber: string, accountId: string, sessionString: string = "") {
    // Convert API ID to number
    const apiIdNumber = parseInt(apiId, 10);
    
    if (isNaN(apiIdNumber)) {
      throw new Error(`Invalid API ID: ${apiId}. API ID must be a number.`);
    }
    
    this.apiId = apiId;
    this.apiHash = apiHash;
    this.phoneNumber = phoneNumber;
    this.accountId = accountId;
    
    // Create a string session (empty or with provided session data)
    this.stringSession = new StringSession(sessionString);
    
    // Create the TelegramClient instance
    this.client = new TelegramClient(
      this.stringSession,
      apiIdNumber,
      apiHash,
      {
        connectionRetries: 5,
        useWSS: true,
        requestRetries: 5,
        autoReconnect: true,
        baseLogger: console
      }
    );
  }
  
  // Method to get authentication state
  public getAuthState(): AuthState {
    return this.authState;
  }
  
  // Method to get session string
  public getSessionString(): string {
    return this.stringSession.save();
  }
  
  // Method to start the client
  protected async startClient(): Promise<void> {
    if (!this.client.connected) {
      console.log("Starting Telegram client...");
      await this.client.connect();
      console.log("Telegram client started");
    } else {
      console.log("Telegram client already connected");
    }
  }
  
  // Method to determine if the client is authenticated
  public async isAuthenticated(): Promise<boolean> {
    try {
      await this.startClient();
      
      // Attempt to get current user to determine if authenticated
      try {
        const currentUser = await this.client.getMe();
        
        if (currentUser) {
          this.authState = 'authenticated';
          return true;
        } else {
          this.authState = 'unauthenticated';
          return false;
        }
      } catch (error) {
        console.error("Error checking authentication status:", error);
        this.authState = 'unauthenticated';
        return false;
      }
    } catch (error) {
      console.error("Failed to start client for authentication check:", error);
      this.authState = 'error';
      return false;
    }
  }
  
  // Helper to safely disconnect client
  protected async safeDisconnect(): Promise<void> {
    if (this.client && this.client.connected) {
      try {
        await this.client.disconnect();
        console.log("Telegram client disconnected");
      } catch (error) {
        console.error("Error disconnecting Telegram client:", error);
      }
    }
  }
}
