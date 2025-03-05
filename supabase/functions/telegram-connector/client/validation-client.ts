
// Client implementation for validating Telegram credentials
import { TelegramClient } from "npm:telegram/client";
import { StringSession } from "npm:telegram/sessions";
import { BaseTelegramClient } from "./base-client.ts";

export class ValidationClient extends BaseTelegramClient {
  async validateCredentials(): Promise<{ success: boolean, error?: string }> {
    console.log('Validating Telegram credentials with:', { 
      apiId: this.apiId, 
      apiHash: this.maskApiHash(this.apiHash), 
      phone: this.maskPhone(this.phoneNumber)
    });
    
    try {
      // Check if API ID is a valid integer
      if (isNaN(this.apiId)) {
        return { 
          success: false, 
          error: "API ID must be a valid integer. Please check your Telegram API credentials." 
        };
      }
      
      // Check if API hash is a valid format (usually 32 hex characters)
      if (!this.apiHash || this.apiHash.length !== 32 || !/^[a-f0-9]+$/i.test(this.apiHash)) {
        return { 
          success: false, 
          error: "API Hash appears to be invalid. It should be a 32-character hexadecimal string." 
        };
      }
      
      // Check if phone number is in a reasonable format
      if (!this.phoneNumber || !this.phoneNumber.startsWith('+')) {
        return { 
          success: false, 
          error: "Phone number must be in international format starting with a + sign (e.g., +12345678901)." 
        };
      }
      
      // Create a temporary client just to validate credentials
      console.log("Creating temporary TelegramClient instance for validation");
      const tempClient = new TelegramClient(
        new StringSession(""),
        this.apiId,
        this.apiHash,
        {
          connectionRetries: 2, // Fewer retries for validation
          useWSS: true,
          deviceModel: "Web Client",
          systemVersion: "1.0.0",
          appVersion: "1.0.0",
        }
      );

      // Try to connect (but don't log in)
      console.log("Attempting to establish basic connection to validate credentials");
      try {
        await tempClient.connect();
      } catch (connectionError) {
        console.error("Error connecting to Telegram:", connectionError);
        
        // Check for specific API errors
        const errorMessage = connectionError.message || "";
        
        if (errorMessage.includes('API_ID_INVALID')) {
          return { 
            success: false, 
            error: "The API ID is invalid. Please check your Telegram API credentials." 
          };
        }
        
        if (errorMessage.includes('API_HASH_INVALID')) {
          return { 
            success: false, 
            error: "The API Hash is invalid. Please check your Telegram API credentials." 
          };
        }
        
        if (errorMessage.includes('PHONE_NUMBER_INVALID')) {
          return { 
            success: false, 
            error: "The phone number format is invalid. Please use international format with + prefix." 
          };
        }
        
        return { 
          success: false, 
          error: `Connection error: ${errorMessage}` 
        };
      }
      
      // If we can connect, the credentials are valid
      const isConnected = tempClient.connected;
      console.log("Basic connection test result, connected:", isConnected);
      
      // Disconnect the temporary client
      await tempClient.disconnect();
      console.log("Disconnected temporary client after validation");
      
      if (isConnected) {
        return { success: true };
      } else {
        return { 
          success: false, 
          error: "Could not establish connection with provided credentials" 
        };
      }
    } catch (error) {
      console.error("Error validating Telegram credentials:", error);
      
      // Check for specific API errors
      if (error.message && (
        error.message.includes('API_ID_INVALID') || 
        error.message.includes('API_HASH_INVALID')
      )) {
        return { 
          success: false, 
          error: "Invalid API ID or API Hash. Please check your Telegram API credentials." 
        };
      }
      
      return { 
        success: false, 
        error: `Validation failed: ${error.message}` 
      };
    }
  }
  
  // Implementation of abstract methods
  getSession(): string {
    return this.stringSession.save();
  }
  
  isConnected(): boolean {
    return false; // Validation client doesn't maintain a connection
  }
}
