/**
 * Validates Telegram API credentials
 */
import { TelegramClient } from "https://esm.sh/telegram@2.19.10";
import { connectToTelegram } from "../connection-handler.ts";

/**
 * Validate the API credentials
 */
export async function validateCredentials(
  client: TelegramClient
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("Validating API credentials...");
    
    // Try connecting to verify credentials
    await connectToTelegram(client);
    
    // If we reach here, credentials are valid
    console.log("API credentials are valid");
    return { success: true };
  } catch (error) {
    console.error("Error validating credentials:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error during validation" 
    };
  }
}
