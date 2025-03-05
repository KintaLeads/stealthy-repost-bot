
// Client implementation for validating Telegram credentials
import { TelegramClient } from "npm:telegram";
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
      if (isNaN(Number(this.apiId))) {
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
        Number(this.apiId),
        this.apiHash,
        {
          connectionRetries: 2, // Fewer retries for validation
          useWSS: true,
          deviceModel: "Web Client",
          systemVersion: "1.0.0",
          appVersion: "1.0.0",
          initConnectionParams: {
            appId: Number(this.apiId),
            appVersion: "1.0",
            systemVersion: "1.0",
            deviceModel: "Telegram Web App"
          },
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
        
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
          return { 
            success: false, 
            error: "Network error: Unable to connect to Telegram servers. Please check your internet connection." 
          };
        }
        
        if (errorMessage.includes('VERSION_OUTDATED')) {
          return {
            success: false,
            error: "The Telegram client library version is outdated. Please update the Edge Function."
          };
        }
        
        if (errorMessage.includes('FLOOD_WAIT')) {
          // Extract wait time if available
          const waitMatch = errorMessage.match(/FLOOD_WAIT_(\d+)/);
          const waitTime = waitMatch ? parseInt(waitMatch[1], 10) : null;
          
          return {
            success: false,
            error: waitTime 
              ? `Too many requests. Please wait ${waitTime} seconds before trying again.` 
              : "Too many requests. Please wait before trying again."
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
      
      if (error.message && error.message.includes('PHONE_NUMBER_INVALID')) {
        return {
          success: false,
          error: "Invalid phone number format. Please use international format with country code (e.g., +12345678901)."
        };
      }
      
      if (error.message && error.message.includes('VERSION_OUTDATED')) {
        return {
          success: false,
          error: "Telegram client library version is outdated. Please update the Edge Function."
        };
      }
      
      if (error.message && error.message.includes('FLOOD_WAIT')) {
        // Extract wait time if available
        const waitMatch = error.message.match(/FLOOD_WAIT_(\d+)/);
        const waitTime = waitMatch ? parseInt(waitMatch[1], 10) : null;
        
        return {
          success: false,
          error: waitTime 
            ? `Too many requests. Please wait ${waitTime} seconds before trying again.` 
            : "Too many requests. Please wait before trying again."
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
