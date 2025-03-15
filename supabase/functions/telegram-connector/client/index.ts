
/**
 * Factory function to create a Telegram client
 */
import { TelegramClientInterface } from "./types.ts";
import { MTProto } from "../proto/index.ts";

export interface ClientCredentials {
  apiId: number | string;
  apiHash: string;
  phoneNumber: string;
  accountId?: string;
}

/**
 * Creates a Telegram client based on the provided credentials
 */
export function createTelegramClient(credentials: ClientCredentials): TelegramClientInterface {
  // Validate that we have the required credentials
  if (!credentials.apiId) {
    throw new Error("Missing API ID");
  }
  
  if (!credentials.apiHash) {
    throw new Error("Missing API Hash");
  }
  
  if (!credentials.phoneNumber) {
    throw new Error("Missing phone number");
  }
  
  // Parse API ID as a number if it's a string
  const apiId = typeof credentials.apiId === 'number' 
    ? credentials.apiId 
    : parseInt(String(credentials.apiId), 10);
  
  if (isNaN(apiId) || apiId <= 0) {
    throw new Error(`Invalid API ID: ${credentials.apiId}`);
  }
  
  console.log(`Creating client with:
    - API ID: ${apiId}
    - API Hash: ${credentials.apiHash.substring(0, 3)}...
    - Phone: ${credentials.phoneNumber.substring(0, 4)}****
    - Account ID: ${credentials.accountId || "unknown"}`);
  
  // Create the MTProto client with proper session handling
  try {
    // IMPORTANT: Using a simplified constructor pattern
    const client = new MTProto(
      apiId,
      credentials.apiHash
    );
    
    // Set phone number on the client for easier access
    (client as any).phoneNumber = credentials.phoneNumber;
    
    // Set account ID on the client for easier access
    (client as any).accountId = credentials.accountId || "unknown";
    
    console.log("Telegram client created successfully");
    
    return {
      getPhoneNumber: () => credentials.phoneNumber,
      getApiId: () => apiId,
      getApiHash: () => credentials.apiHash,
      getAccountId: () => credentials.accountId || "unknown",
      getSession: () => "", // Always return empty string for now
      getAuthState: () => "initializing", // This would be updated later
      getClient: () => client,
      exportSession: async () => {
        try {
          return ""; // Always return empty string for now
        } catch (error) {
          console.error("Error exporting session:", error);
          return "";
        }
      },
      // Add missing interface methods
      connect: async () => { 
        // This is a stub, will be replaced in full implementation
        return { success: false, error: "Not implemented" }; 
      },
      verifyCode: async () => { 
        return { success: false, error: "Not implemented" }; 
      }
    };
  } catch (error) {
    console.error("Error creating Telegram client:", error);
    throw new Error(`Failed to create Telegram client: ${error instanceof Error ? error.message : String(error)}`);
  }
}
