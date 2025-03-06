
// Client class for validating Telegram API credentials
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
      
      // Try to connect to the Telegram API
      console.log("Attempting to connect to Telegram API...");
      
      try {
        await this.startClient();
        console.log("Successfully connected to Telegram API");
        
        // Disconnect after successful validation
        await this.safeDisconnect();
        
        return {
          success: true
        };
      } catch (connectionError) {
        console.error("Error connecting to Telegram API:", connectionError);
        
        // Determine the specific error message
        let errorMessage = "Failed to connect to Telegram API";
        
        if (connectionError instanceof Error) {
          // Check for specific error types
          const errorText = connectionError.message.toLowerCase();
          
          if (errorText.includes("api_id") || errorText.includes("api_hash")) {
            errorMessage = "Invalid API ID or API Hash. Please check your Telegram API credentials.";
          } else if (errorText.includes("flood")) {
            errorMessage = "Too many requests. Please try again later (Telegram rate limit).";
          } else if (errorText.includes("network")) {
            errorMessage = "Network error connecting to Telegram. Please check your internet connection.";
          } else if (errorText.includes("timeout")) {
            errorMessage = "Connection to Telegram timed out. Please try again.";
          } else {
            // Use the original error message if available
            errorMessage = connectionError.message || errorMessage;
          }
        }
        
        return {
          success: false,
          error: errorMessage
        };
      } finally {
        // Ensure client is disconnected
        await this.safeDisconnect();
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
