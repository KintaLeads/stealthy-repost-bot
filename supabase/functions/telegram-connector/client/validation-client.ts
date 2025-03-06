
// Client for validating Telegram credentials
import { BaseTelegramClient } from './base-client.ts';

export class ValidationClient extends BaseTelegramClient {
  constructor(apiId: string, apiHash: string, phoneNumber: string, accountId: string, sessionString: string = "") {
    super(apiId, apiHash, phoneNumber, accountId, sessionString);
    console.log("Creating ValidationClient");
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
      
      // Instead of trying to use auth.testCredentials directly (which doesn't exist),
      // we'll check connectivity to Telegram's public API
      try {
        console.log("Testing connectivity to Telegram API...");
        
        // First, test connectivity to Telegram's API server
        const telegramTestResponse = await fetch("https://api.telegram.org/");
        if (!telegramTestResponse.ok) {
          console.error("Cannot connect to Telegram API:", await telegramTestResponse.text());
          return {
            success: false,
            error: "Cannot connect to Telegram API. Please check your internet connection."
          };
        }
        
        console.log("Basic Telegram connectivity confirmed");
        
        // For a more accurate test of API credentials, we would need to implement the actual
        // MTProto authentication flow, which requires a more complex implementation.
        // For now, we'll consider the validation successful if the API ID, API Hash and 
        // phone number are in the correct format and we can connect to Telegram's servers.
        console.log("Credential format validated successfully");
        
        return {
          success: true,
          message: "Basic validation of Telegram API credential format successful"
        };
      } catch (apiError) {
        console.error("Error connecting to Telegram:", apiError);
        
        return {
          success: false,
          error: apiError instanceof Error 
            ? `Cannot connect to Telegram: ${apiError.message}` 
            : "Cannot connect to Telegram API"
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
