
import { BaseClient } from "./base-client.ts";

export class ValidationClient extends BaseClient {
  constructor(apiId: string, apiHash: string, phoneNumber: string, accountId: string, sessionString: string = "") {
    super(apiId, apiHash, phoneNumber, accountId, sessionString);
  }
  
  // Method to validate API credentials
  async validateCredentials(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("ValidationClient: Validating credentials...");
      console.log(`ValidationClient: Using API ID: ${this.apiId}, Phone: ${this.phoneNumber}`);
      
      // Simple validation check - ensure all required parameters exist
      if (!this.apiId || !this.apiHash || !this.phoneNumber) {
        const missingParams = [];
        if (!this.apiId) missingParams.push("API ID");
        if (!this.apiHash) missingParams.push("API Hash");
        if (!this.phoneNumber) missingParams.push("Phone Number");
        
        console.log(`ValidationClient: Missing parameters: ${missingParams.join(", ")}`);
        return { 
          success: false, 
          error: `Missing required parameters: ${missingParams.join(", ")}` 
        };
      }
      
      // Log redacted version of credentials for debugging (no maskApiHash call)
      console.log(`ValidationClient: Validating with API ID: ${this.apiId}, API Hash: ${this.apiHash.substring(0, 4)}...${this.apiHash.substring(this.apiHash.length - 4)}, Phone: ${this.phoneNumber}`);
      
      // For this basic validation implementation, we're just checking parameter formats
      // In a real implementation, you would make an actual connection attempt
      if (isNaN(Number(this.apiId))) {
        console.log("ValidationClient: Invalid API ID format, must be numeric");
        return { success: false, error: "Invalid API ID format. Must be numeric." };
      }
      
      if (this.apiHash.length !== 32) {
        console.log("ValidationClient: Invalid API Hash format, must be 32 characters");
        return { success: false, error: "Invalid API Hash format. Must be 32 characters." };
      }
      
      // Simple phone number format check - just checking if it starts with + and has digits
      if (!this.phoneNumber.startsWith("+") || !/\d/.test(this.phoneNumber)) {
        console.log("ValidationClient: Invalid phone number format");
        return { success: false, error: "Invalid phone number format." };
      }
      
      console.log("ValidationClient: Basic validation passed");
      return { success: true };
    } catch (error) {
      console.error("ValidationClient: Error during validation:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error during validation" };
    }
  }
}
