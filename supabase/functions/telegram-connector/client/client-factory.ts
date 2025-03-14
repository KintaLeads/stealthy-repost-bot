
import { TelegramClientInterface, TelegramClientOptions } from "./types.ts";
import { TelegramCombinedImplementation } from "./implementation/telegram-combined-impl.ts";

/**
 * Factory for creating Telegram client instances
 */
export class TelegramClientFactory {
  /**
   * Creates a Telegram client with the provided options
   */
  static createClient(options: TelegramClientOptions): TelegramClientInterface {
    console.log("[CLIENT-FACTORY] Creating Telegram client with MTProto implementation");
    
    const { apiId, apiHash, phoneNumber, accountId, sessionString = "" } = options;
    
    // Log the received options
    console.log(`[CLIENT-FACTORY] Received options:
      - apiId: ${apiId} (${typeof apiId})
      - apiHash: ${apiHash ? apiHash.substring(0, 3) + '...' : 'undefined'} (${typeof apiHash})
      - phoneNumber: ${phoneNumber ? phoneNumber.substring(0, 4) + '****' : 'none'} (${typeof phoneNumber})
      - accountId: ${accountId} (${typeof accountId})
      - sessionString: ${sessionString ? 'provided' : 'none'} (${typeof sessionString})`);
    
    // Convert apiId to string if needed and validate
    const apiIdStr = String(apiId || "");
    
    // Validate required parameters
    if (!apiIdStr || apiIdStr === "undefined" || apiIdStr === "null" || apiIdStr.trim() === "") {
      console.error("[CLIENT-FACTORY] Invalid API ID provided:", apiId, "type:", typeof apiId);
      throw new Error(`API ID cannot be empty or undefined, received: ${JSON.stringify(apiId)}`);
    }
    
    if (!apiHash || apiHash === "undefined" || apiHash === "null" || apiHash.trim() === "") {
      console.error("[CLIENT-FACTORY] Invalid API Hash provided:", apiHash, "type:", typeof apiHash);
      throw new Error(`API Hash cannot be empty or undefined, received: ${JSON.stringify(apiHash)}`);
    }
    
    // Convert API ID to a number before creating the implementation
    const numericApiId = parseInt(apiIdStr, 10);
    if (isNaN(numericApiId) || numericApiId <= 0) {
      console.error(`[CLIENT-FACTORY] Invalid API ID format: "${apiId}" (parsed as ${numericApiId})`);
      throw new Error(`API ID must be a positive number, got: ${apiId}`);
    }
    
    // Log the final values after validation
    console.log(`[CLIENT-FACTORY] Creating TelegramCombinedImplementation with:
      - apiId (string): ${apiIdStr} (${typeof apiIdStr})
      - apiId (number): ${numericApiId} (${typeof numericApiId})
      - apiHash: ${apiHash.substring(0, 3)}... (${typeof apiHash})
      - phoneNumber: ${phoneNumber ? phoneNumber.substring(0, 4) + '****' : 'none'} (${typeof phoneNumber})
      - accountId: ${accountId} (${typeof accountId})
      - sessionString: ${sessionString ? 'provided' : 'none'} (${typeof sessionString})`);
    
    // Pass the numeric API ID to the constructor
    return new TelegramCombinedImplementation(
      numericApiId, 
      apiHash, 
      phoneNumber, 
      accountId, 
      sessionString
    );
  }
}
