
// Client for validating Telegram credentials using direct HTTP
import { BaseTelegramClient } from './base-client.ts';

export class ValidationClient extends BaseTelegramClient {
  constructor(apiId: string, apiHash: string, phoneNumber: string, accountId: string, sessionString: string = "") {
    super(apiId, apiHash, phoneNumber, accountId, sessionString);
    console.log("Creating ValidationClient with direct HTTP implementation");
  }
  
  /**
   * Validates that the provided API credentials are valid
   */
  async validateCredentials(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("Starting validation of Telegram API credentials");
      
      // Check for missing required parameters
      if (!this.apiId || !this.apiHash || !this.phoneNumber) {
        const missingParams = [];
        if (!this.apiId) missingParams.push("API ID");
        if (!this.apiHash) missingParams.push("API Hash");
        if (!this.phoneNumber) missingParams.push("Phone Number");
        
        return {
          success: false,
          error: `Missing required parameters: ${missingParams.join(", ")}`
        };
      }
      
      // For API ID, check if it's a valid number
      if (isNaN(Number(this.apiId))) {
        return {
          success: false,
          error: "API ID must be a valid number"
        };
      }
      
      // For API Hash, check if it has the expected format (32 hex characters)
      if (!/^[a-f0-9]{32}$/i.test(this.apiHash)) {
        return {
          success: false,
          error: "API Hash must be a 32-character hexadecimal string"
        };
      }
      
      // For phone number, check basic format
      if (!/^\+?[0-9]{7,15}$/.test(this.phoneNumber.replace(/\s+/g, ''))) {
        return {
          success: false,
          error: "Phone number must be in a valid international format (e.g., +12345678901)"
        };
      }
      
      // Make a test request to validate credentials
      try {
        // Using a simple method that doesn't require full auth but will validate our API credentials
        await this.makeApiRequest('auth.testCredentials', {
          phone_number: this.phoneNumber
        });
        
        // If we reach here, the credentials are valid
        return {
          success: true
        };
      } catch (apiError) {
        // Check for credential-specific errors
        const errorMessage = apiError instanceof Error ? apiError.message : "Unknown API error";
        
        if (errorMessage.includes("api_id") || errorMessage.includes("api_hash")) {
          return {
            success: false,
            error: "Invalid API ID or API Hash"
          };
        }
        
        if (errorMessage.includes("phone_number")) {
          return {
            success: false,
            error: "Invalid phone number format"
          };
        }
        
        return {
          success: false,
          error: `API validation failed: ${errorMessage}`
        };
      }
    } catch (error) {
      console.error("Unexpected error during validation:", error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred during validation"
      };
    }
  }
}
