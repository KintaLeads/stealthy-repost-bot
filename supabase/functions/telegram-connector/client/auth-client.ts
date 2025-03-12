
// Client for handling authentication operations using MTProto
import { BaseClient, AuthState } from './base-client.ts';
import { AuthenticationResult, VerificationResult } from './types/auth-types.ts';
import { requestVerificationCode, verifyAuthenticationCode } from './utils/auth-code-manager.ts';

export class AuthClient extends BaseClient {
  private phoneCodeHash: string = "";
  
  constructor(apiId: string, apiHash: string, phoneNumber: string, accountId: string, sessionString: string = "") {
    super(apiId, apiHash, phoneNumber, accountId, sessionString);
    console.log("Creating AuthClient with MTProto implementation");
  }

  /**
   * Start the authentication process
   */
  async startAuthentication(): Promise<AuthenticationResult> {
    try {
      console.log("Starting authentication process with MTProto");
      
      // Check if we already have a valid session
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
      
      // Initialize the client if needed
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
      
      // Request verification code
      const codeResult = await requestVerificationCode(
        this.client, 
        this.phoneNumber, 
        this.apiId,
        this.apiHash
      );
      
      if (!codeResult.success) {
        return {
          success: false,
          error: codeResult.error
        };
      }
      
      // Save the phone code hash for later use
      this.phoneCodeHash = codeResult.phoneCodeHash || "";
      this.authState = "awaiting_code";
      
      return {
        success: true,
        codeNeeded: true,
        phoneCodeHash: this.phoneCodeHash,
        _testCode: codeResult._testCode
      };
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
  async verifyAuthenticationCode(code: string, phone_code_hash?: string): Promise<VerificationResult> {
    try {
      console.log(`Verifying authentication code: ${code}`);
      
      // Use either the provided phone code hash or the stored one
      const phoneCodeHash = phone_code_hash || this.phoneCodeHash;
      
      if (!phoneCodeHash) {
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
      
      // Verify the code
      const verificationResult = await verifyAuthenticationCode(
        this.client,
        this.phoneNumber,
        phoneCodeHash,
        code
      );
      
      if (!verificationResult.success) {
        return {
          success: false,
          error: verificationResult.error
        };
      }
      
      // Update auth state
      this.authState = "authorized";
      
      // Save the session
      await this.saveSession();
      
      return {
        success: true,
        session: this.sessionString
      };
    } catch (error) {
      console.error("Exception during code verification:", error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred during verification"
      };
    }
  }
}
