
// Auth client for handling Telegram authentication using MTProto
import { BaseClient } from './base-client.ts';

export class AuthClient extends BaseClient {
  // Store phone code hash during authentication flow
  private phoneCodeHash: string = '';
  
  constructor(apiId: string, apiHash: string, phoneNumber: string, accountId: string, sessionString: string = "") {
    super(apiId, apiHash, phoneNumber, accountId, sessionString);
    console.log("Creating AuthClient with MTProto");
  }
  
  /**
   * Start the authentication process using MTProto
   */
  async startAuthentication(options: Record<string, any> = {}): Promise<{ success: boolean; codeNeeded?: boolean; phoneCodeHash?: string; error?: string; session?: string; _testCode?: string }> {
    try {
      console.log("Starting MTProto authentication process");
      
      // Check if we're already authenticated
      const isAuthorized = await this.isAuthenticated();
      
      if (isAuthorized) {
        console.log("Already authenticated with MTProto");
        
        return {
          success: true,
          codeNeeded: false,
          session: this.sessionString
        };
      }
      
      // Test connectivity to Telegram API
      try {
        await this.initMTProto();
        console.log("Connectivity to Telegram API confirmed via MTProto");
      } catch (connectError) {
        console.error("Cannot connect to Telegram API via MTProto:", connectError);
        return {
          success: false,
          error: connectError instanceof Error 
            ? `Cannot connect to Telegram: ${connectError.message}` 
            : "Cannot connect to Telegram API"
        };
      }
      
      // First check if the phone is registered
      const checkPhoneResult = await this.callMTProto('auth.checkPhone', {
        phone: this.phoneNumber
      });
      
      if (checkPhoneResult.error) {
        console.error("Error checking phone:", checkPhoneResult.error);
        return {
          success: false,
          error: checkPhoneResult.error.message || "Error checking phone"
        };
      }
      
      if (!checkPhoneResult.phone_registered) {
        return {
          success: false,
          error: "Phone number is not registered with Telegram"
        };
      }
      
      // Send authentication code
      const sendCodeResult = await this.callMTProto('auth.sendCode', {
        phone: this.phoneNumber,
        api_id: this.apiId,
        api_hash: this.apiHash,
        settings: {
          allow_app_hash_login: true
        }
      });
      
      if (sendCodeResult.error) {
        console.error("Error sending authentication code:", sendCodeResult.error);
        this.authState = 'unauthorized';
        
        return {
          success: false,
          error: sendCodeResult.error.message || "Error sending authentication code"
        };
      }
      
      // Store the phone code hash
      this.phoneCodeHash = sendCodeResult.phone_code_hash;
      this.authState = 'awaiting_code';
      
      console.log("Code sent successfully via MTProto, awaiting verification");
      
      return {
        success: true,
        codeNeeded: true,
        phoneCodeHash: this.phoneCodeHash
      };
    } catch (error) {
      console.error("Error starting MTProto authentication:", error);
      this.authState = 'unauthorized';
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error during authentication"
      };
    }
  }
  
  /**
   * Verify the authentication code sent to the user's phone using MTProto
   */
  async verifyAuthenticationCode(code: string, options: Record<string, any> = {}): Promise<{ success: boolean; error?: string; session?: string }> {
    try {
      console.log(`Verifying MTProto authentication code: ${code}`);
      
      if (!this.phoneCodeHash) {
        return {
          success: false,
          error: "No active authentication session. Please start authentication first."
        };
      }
      
      // Validate the code format
      if (!code || code.trim().length < 5) {
        return {
          success: false,
          error: "Invalid verification code format. Code should be at least 5 characters."
        };
      }
      
      // Sign in with the code
      const signInResult = await this.callMTProto('auth.signIn', {
        phone: this.phoneNumber,
        phone_code_hash: this.phoneCodeHash,
        phone_code: code
      });
      
      if (signInResult.error) {
        console.error("Error verifying code:", signInResult.error);
        this.authState = 'unauthorized';
        
        return {
          success: false,
          error: signInResult.error.message || "Error verifying authentication code"
        };
      }
      
      // Authentication successful
      this.authState = 'authorized';
      
      // Save the session
      await this.saveSession();
      
      console.log("MTProto authentication successful, session created");
      
      return {
        success: true,
        session: this.sessionString
      };
    } catch (error) {
      console.error("Error verifying MTProto authentication code:", error);
      this.authState = 'unauthorized';
      
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
