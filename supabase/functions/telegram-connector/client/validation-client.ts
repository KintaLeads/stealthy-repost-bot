
// Client for validating MTProto API credentials
import { BaseClient } from './base-client.ts';

export class ValidationClient extends BaseClient {
  constructor(apiId: string, apiHash: string, phoneNumber: string, accountId: string, sessionString: string = "") {
    super(apiId, apiHash, phoneNumber, accountId, sessionString);
    console.log("Creating ValidationClient with MTProto implementation");
  }
  
  /**
   * Validate the API credentials with MTProto
   */
  async validateCredentials(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("Validating credentials with MTProto");
      
      // Initialize the client if not already done
      if (!this.client) {
        console.log("Initializing MTProto client for validation");
        this.client = this.initMTProto();
      }
      
      // Try to get current user info to verify credentials
      // This will throw an error if credentials are invalid
      try {
        console.log("Testing credentials with getConfig method");
        
        // Simple API call to test credentials
        const result = await this.callMTProto('help.getConfig', {});
        
        if (result.error) {
          console.error("Error validating credentials:", result.error);
          
          return {
            success: false,
            error: `Invalid API credentials: ${result.error}`
          };
        }
        
        console.log("Credentials validated successfully");
        
        return {
          success: true
        };
      } catch (error) {
        console.error("Error calling MTProto methods:", error);
        
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error validating credentials"
        };
      }
    } catch (error) {
      console.error("Exception during credential validation:", error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred during validation"
      };
    }
  }
}
