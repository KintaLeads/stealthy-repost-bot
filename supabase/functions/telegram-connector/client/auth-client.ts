
// Auth client for handling Telegram authentication using direct HTTP
import { BaseTelegramClient } from './base-client.ts';

export class AuthClient extends BaseTelegramClient {
  // Store phone code hash during authentication flow
  private phoneCodeHash: string = '';
  
  constructor(apiId: string, apiHash: string, phoneNumber: string, accountId: string, sessionString: string = "") {
    super(apiId, apiHash, phoneNumber, accountId, sessionString);
    console.log("Creating AuthClient with direct HTTP implementation");
  }
  
  /**
   * Start the authentication process
   */
  async startAuthentication(options: Record<string, any> = {}): Promise<{ success: boolean; codeNeeded?: boolean; phoneCodeHash?: string; error?: string; session?: string }> {
    try {
      console.log("Starting authentication process");
      
      // Check if we're already authenticated
      const isAuthorized = await this.isAuthenticated();
      
      if (isAuthorized) {
        console.log("Already authenticated");
        
        return {
          success: true,
          codeNeeded: false,
          session: this.sessionString
        };
      }
      
      // We're not authenticated yet, so we need to send the code
      console.log("Not authenticated, sending code to phone");
      
      try {
        // Make request to send authentication code
        const response = await this.makeApiRequest('auth.sendCode', {
          phone_number: this.phoneNumber,
          settings: {
            allow_flashcall: false,
            allow_missed_call: false,
            allow_app_hash: true
          }
        });
        
        if (response.phone_code_hash) {
          this.phoneCodeHash = response.phone_code_hash;
          this.authState = 'awaiting_verification';
          
          return {
            success: true,
            codeNeeded: true,
            phoneCodeHash: this.phoneCodeHash
          };
        } else {
          return {
            success: false,
            error: "Failed to get phone code hash from Telegram"
          };
        }
      } catch (apiError) {
        console.error("Error sending code:", apiError);
        this.authState = 'error';
        
        return {
          success: false,
          error: apiError instanceof Error ? apiError.message : "Failed to send verification code"
        };
      }
    } catch (error) {
      console.error("Error starting authentication:", error);
      this.authState = 'error';
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error during authentication"
      };
    }
  }
  
  /**
   * Verify the authentication code sent to the user's phone
   */
  async verifyAuthenticationCode(code: string, options: Record<string, any> = {}): Promise<{ success: boolean; error?: string; session?: string }> {
    try {
      console.log(`Verifying authentication code: ${code}`);
      
      if (!this.phoneCodeHash) {
        return {
          success: false,
          error: "No active authentication session. Please start authentication first."
        };
      }
      
      try {
        // Make request to sign in with the code
        const response = await this.makeApiRequest('auth.signIn', {
          phone_number: this.phoneNumber,
          phone_code_hash: this.phoneCodeHash,
          phone_code: code
        });
        
        if (response.user) {
          // Successfully authenticated
          this.authState = 'authenticated';
          
          // Get session string from response
          this.sessionString = response.session || `session_${Date.now()}_${this.accountId}`;
          
          return {
            success: true,
            session: this.sessionString
          };
        } else {
          return {
            success: false,
            error: "Authentication failed: Invalid response from Telegram"
          };
        }
      } catch (apiError) {
        console.error("Error verifying code:", apiError);
        
        const errorMessage = apiError instanceof Error ? apiError.message : "Unknown API error";
        
        // Check for code-specific errors
        if (errorMessage.includes("PHONE_CODE_INVALID")) {
          return {
            success: false,
            error: "Invalid verification code"
          };
        }
        
        if (errorMessage.includes("PHONE_CODE_EXPIRED")) {
          return {
            success: false,
            error: "Verification code has expired"
          };
        }
        
        return {
          success: false,
          error: `Verification failed: ${errorMessage}`
        };
      }
    } catch (error) {
      console.error("Error verifying authentication code:", error);
      this.authState = 'error';
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error during code verification"
      };
    } finally {
      // Reset the phone code hash
      this.phoneCodeHash = '';
    }
  }
}
