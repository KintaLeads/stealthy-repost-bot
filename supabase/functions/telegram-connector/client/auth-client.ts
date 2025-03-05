
// Client implementation for authentication operations with Telegram
import { TelegramClient } from "npm:telegram/client";
import { Api } from "npm:telegram/tl";
import { BaseTelegramClient } from "./base-client.ts";

export class AuthClient extends BaseTelegramClient {
  private client: TelegramClient | null = null;
  
  async connect(): Promise<{ success: boolean, codeNeeded: boolean, phoneCodeHash?: string, error?: string }> {
    console.log('Connecting to Telegram with:', { 
      apiId: this.apiId, 
      apiHash: this.maskApiHash(this.apiHash), 
      phone: this.maskPhone(this.phoneNumber),
      accountId: this.accountId,
      hasSession: this.stringSession.save() !== ''
    });
    
    try {
      console.log("Creating new TelegramClient instance");
      this.client = new TelegramClient(
        this.stringSession,
        this.apiId,
        this.apiHash,
        {
          connectionRetries: 5,
          useWSS: true,
          deviceModel: "Web Client",
          systemVersion: "1.0.0",
          appVersion: "1.0.0",
        }
      );

      // Connect but don't login yet
      console.log("Calling client.connect()");
      await this.client.connect();
      console.log("Initial connection result, connected:", this.client.connected);
      
      // If we have a session string and client is connected, we're already authenticated
      if (this.stringSession.save() !== '' && this.client.connected) {
        console.log("Session string exists, testing if it's valid by getting self");
        try {
          // Test the session by getting self
          const me = await this.client.getMe();
          console.log("Session valid, got self:", me);
          this.authState = 'authenticated';
          return { success: true, codeNeeded: false };
        } catch (error) {
          console.error("Stored session is invalid, need to re-authenticate:", error);
          // Continue with authentication flow
        }
      }
      
      // Check if the client is connected
      if (!this.client.connected) {
        console.error("Failed to connect to Telegram API");
        return { success: false, codeNeeded: false, error: "Failed to establish connection to Telegram" };
      }
      
      // Request the login code to be sent via SMS
      console.log("Sending code request to phone:", this.maskPhone(this.phoneNumber));
      const { phoneCodeHash } = await this.client.sendCode({
        apiId: this.apiId,
        apiHash: this.apiHash,
        phoneNumber: this.phoneNumber,
      });
      
      this.phoneCodeHash = phoneCodeHash;
      this.authState = 'code_needed';
      
      console.log("Code sent to phone, waiting for verification. phoneCodeHash:", phoneCodeHash);
      return { success: true, codeNeeded: true, phoneCodeHash };
    } catch (error) {
      console.error("Error connecting to Telegram:", error);
      return { success: false, codeNeeded: false, error: error.message };
    }
  }

  async verifyCode(code: string): Promise<{ success: boolean; error?: string }> {
    if (!this.client || !this.phoneCodeHash) {
      console.error("Cannot verify code: Client not initialized or code request not sent");
      return { success: false, error: "Authentication flow not properly initialized" };
    }
    
    try {
      console.log("Attempting to sign in with code");
      await this.client.invoke(new Api.auth.SignIn({
        phoneNumber: this.phoneNumber,
        phoneCodeHash: this.phoneCodeHash,
        phoneCode: code
      }));
      
      this.authState = 'authenticated';
      console.log("Successfully authenticated with code");
      return { success: true };
    } catch (error) {
      console.error("Error verifying code:", error);
      
      // Check if error is because user is already logged in (common case)
      if (error.message && (
          error.message.includes('AUTH_KEY_UNREGISTERED') || 
          error.message.includes('SESSION_PASSWORD_NEEDED') ||
          error.message.includes('PHONE_CODE_INVALID') ||
          error.message.includes('PHONE_NUMBER_UNOCCUPIED')
      )) {
        // These are special cases that might still allow us to proceed
        console.log("Special error case detected in verification:", error.message);
        
        if (error.message.includes('PHONE_CODE_INVALID')) {
          return { success: false, error: "Invalid verification code. Please try again." };
        }
        
        if (error.message.includes('PHONE_NUMBER_UNOCCUPIED')) {
          console.log("Phone number not registered with Telegram, attempting signup");
          try {
            // Try to sign up with this number
            await this.client.signUp({
              phoneNumber: this.phoneNumber,
              phoneCodeHash: this.phoneCodeHash,
              firstName: "Telegram",
              lastName: "User"
            });
            this.authState = 'authenticated';
            console.log("Signup successful");
            return { success: true };
          } catch (signupError) {
            console.error("Error signing up:", signupError);
            return { success: false, error: "Failed to sign up with this phone number: " + signupError.message };
          }
        }
        
        // For other cases like SESSION_PASSWORD_NEEDED, we consider it authenticated
        this.authState = 'authenticated';
        console.log("User seems to be already authenticated or needs 2FA");
        return { success: true };
      }
      
      return { success: false, error: error.message };
    }
  }
  
  getSession(): string {
    const sessionStr = this.stringSession.save();
    console.log(`Getting session string, length: ${sessionStr.length}`);
    return sessionStr;
  }
  
  isConnected(): boolean {
    return !!this.client?.connected && this.authState === 'authenticated';
  }
}
