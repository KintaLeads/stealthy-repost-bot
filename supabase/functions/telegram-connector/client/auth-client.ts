
// Auth client for handling Telegram authentication
import { TelegramClient, Api } from 'npm:telegram';
import { BaseTelegramClient } from './base-client.ts';

export class AuthClient extends BaseTelegramClient {
  // Store phone code hash during authentication flow
  private phoneCodeHash: string | null = null;

  constructor(apiId: string, apiHash: string, phoneNumber: string, accountId: string, sessionString: string = "") {
    super(apiId, apiHash, phoneNumber, accountId, sessionString);
  }
  
  /**
   * Start the authentication process
   */
  async startAuthentication(options: Record<string, any> = {}): Promise<{ success: boolean; codeNeeded?: boolean; phoneCodeHash?: string; error?: string; session?: string }> {
    try {
      console.log("Starting authentication process...");
      
      // Connect to Telegram
      await this.startClient();
      
      // Check if already authenticated
      const isAlreadyAuthenticated = await this.isAuthenticated();
      
      if (isAlreadyAuthenticated) {
        console.log("Already authenticated");
        
        // Save the session string
        const sessionString = this.getSessionString();
        
        return {
          success: true,
          codeNeeded: false,
          session: sessionString
        };
      }
      
      // Not authenticated, so we need to send the code
      console.log("Need to authenticate. Sending code to phone...");
      
      const { phoneCodeHash } = await this.client.sendCode(
        {
          apiId: parseInt(this.apiId, 10),
          apiHash: this.apiHash
        },
        this.phoneNumber
      );
      
      // Store the phone code hash for later use
      this.phoneCodeHash = phoneCodeHash;
      this.authState = 'awaiting_verification';
      
      console.log("Code sent to phone successfully");
      
      return {
        success: true,
        codeNeeded: true,
        phoneCodeHash: this.phoneCodeHash
      };
    } catch (error) {
      console.error("Error starting authentication:", error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to start authentication process"
      };
    }
  }
  
  /**
   * Verify the authentication code sent to the user's phone
   */
  async verifyAuthenticationCode(code: string, options: Record<string, any> = {}): Promise<{ success: boolean; error?: string; session?: string }> {
    try {
      console.log("Verifying authentication code...");
      
      if (!this.phoneCodeHash) {
        return {
          success: false,
          error: "Authentication flow not started. Please call startAuthentication first."
        };
      }
      
      if (!code || code.trim() === "") {
        return {
          success: false,
          error: "Verification code is required"
        };
      }
      
      // Clean the code (remove spaces and special characters)
      const cleanCode = code.replace(/\D/g, "");
      
      if (cleanCode.length < 5) {
        return {
          success: false,
          error: "Invalid verification code format"
        };
      }
      
      console.log("Signing in with code...");
      
      // Sign in with the provided code
      await this.client.invoke(
        {
          _: "auth.signIn",
          phoneNumber: this.phoneNumber,
          phoneCodeHash: this.phoneCodeHash,
          phoneCode: cleanCode
        }
      );
      
      // Check if we're authenticated after signing in
      const isAuthenticated = await this.isAuthenticated();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: "Failed to authenticate with provided code"
        };
      }
      
      console.log("Successfully authenticated!");
      
      // Get and return the session string for future use
      const sessionString = this.getSessionString();
      
      return {
        success: true,
        session: sessionString
      };
    } catch (error) {
      console.error("Error verifying authentication code:", error);
      
      // Handle specific errors
      if (error instanceof Error) {
        const errorMessage = error.message;
        
        if (errorMessage.includes("SESSION_PASSWORD_NEEDED")) {
          return {
            success: false,
            error: "Two-factor authentication is enabled for this account. Please disable it temporarily or use a different account."
          };
        }
        
        if (errorMessage.includes("PHONE_CODE_INVALID")) {
          return {
            success: false,
            error: "Invalid verification code. Please check the code and try again."
          };
        }
        
        if (errorMessage.includes("PHONE_CODE_EXPIRED")) {
          return {
            success: false,
            error: "Verification code has expired. Please request a new code."
          };
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to verify authentication code"
      };
    }
  }
}
