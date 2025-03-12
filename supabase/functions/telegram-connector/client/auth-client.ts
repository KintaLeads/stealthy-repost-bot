
// Client for handling authentication operations using MTProto
import { BaseClient } from './base-client.ts';

export class AuthClient extends BaseClient {
  private phoneCodeHash: string = "";
  
  constructor(apiId: string, apiHash: string, phoneNumber: string, accountId: string, sessionString: string = "") {
    super(apiId, apiHash, phoneNumber, accountId, sessionString);
    console.log("Creating AuthClient with MTProto implementation");
  }

  /**
   * Start the authentication process
   */
  async startAuthentication(): Promise<{ success: boolean; codeNeeded?: boolean; phoneCodeHash?: string; error?: string; session?: string; _testCode?: string }> {
    try {
      console.log("Starting authentication process with MTProto");
      
      // If we already have a session string, check if it's valid
      if (this.sessionString) {
        console.log("Session string is present, checking if it's valid");
        
        const isAuthenticated = await this.isAuthenticated();
        
        if (isAuthenticated) {
          console.log("Already authenticated, no need for verification code");
          this.authState = "authorized";
          
          return {
            success: true,
            codeNeeded: false,
            session: this.sessionString
          };
        } else {
          console.log("Session invalid, need to re-authenticate");
          this.sessionString = "";
          this.authState = "unauthorized";
        }
      }
      
      // Initialize the client
      if (!this.client) {
        console.log("Initializing MTProto client");
        this.client = this.initMTProto();
      }
      
      // First check if we are already logged in
      try {
        console.log("Checking if already logged in");
        const user = await this.callMTProto('users.getFullUser', {
          id: {
            _: 'inputUserSelf'
          }
        });
        
        if (!user.error) {
          console.log("Already logged in, no code needed");
          this.authState = "authorized";
          
          // Save the session
          await this.saveSession();
          
          return {
            success: true,
            codeNeeded: false,
            session: this.sessionString
          };
        }
      } catch (error) {
        console.log("Not logged in yet, proceeding with authentication", error);
      }
      
      // Send the phone number to get a verification code
      console.log(`Sending verification code to phone: ${this.phoneNumber}`);
      
      try {
        const sentCode = await this.callMTProto('auth.sendCode', {
          phone_number: this.phoneNumber,
          settings: {
            _: 'codeSettings',
            allow_flashcall: false,
            current_number: true,
            allow_app_hash: true,
          }
        });
        
        if (sentCode.error) {
          console.error("Error sending verification code:", sentCode.error);
          
          return {
            success: false,
            error: `Error sending verification code: ${sentCode.error}`
          };
        }
        
        console.log("Verification code sent successfully");
        
        // Save the phone code hash for later use
        this.phoneCodeHash = sentCode.phone_code_hash;
        this.authState = "awaiting_code";
        
        return {
          success: true,
          codeNeeded: true,
          phoneCodeHash: this.phoneCodeHash,
          _testCode: sentCode._testMode ? sentCode.phone_code : undefined // Only included in test environment
        };
      } catch (error) {
        console.error("Error sending verification code:", error);
        
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error sending verification code"
        };
      }
    } catch (error) {
      console.error("Exception during authentication:", error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred during authentication"
      };
    }
  }
  
  /**
   * Verify the authentication code sent to the phone
   */
  async verifyAuthenticationCode(code: string): Promise<{ success: boolean; error?: string; session?: string }> {
    try {
      console.log(`Verifying authentication code: ${code}`);
      
      if (!this.phoneCodeHash) {
        console.error("No phone code hash available, cannot verify code");
        
        return {
          success: false,
          error: "No phone code hash available. Please request a new verification code."
        };
      }
      
      // Initialize the client if needed
      if (!this.client) {
        console.log("Initializing MTProto client for verification");
        this.client = this.initMTProto();
      }
      
      // Sign in with the code
      try {
        const signInResult = await this.callMTProto('auth.signIn', {
          phone_number: this.phoneNumber,
          phone_code_hash: this.phoneCodeHash,
          phone_code: code
        });
        
        if (signInResult.error) {
          console.error("Error signing in:", signInResult.error);
          
          // Special case for 2FA
          if (signInResult.error === 'SESSION_PASSWORD_NEEDED') {
            return {
              success: false,
              error: "Two-factor authentication is required but not supported in this version."
            };
          }
          
          return {
            success: false,
            error: `Error signing in: ${signInResult.error}`
          };
        }
        
        console.log("Authentication successful!");
        this.authState = "authorized";
        
        // Save the session
        await this.saveSession();
        
        return {
          success: true,
          session: this.sessionString
        };
      } catch (error) {
        console.error("Error verifying code:", error);
        
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error verifying code"
        };
      }
    } catch (error) {
      console.error("Exception during code verification:", error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred during verification"
      };
    }
  }
}
