
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
    console.log("Creating Telegram client with MTProto implementation");
    
    const { apiId, apiHash, phoneNumber, accountId, sessionString = "" } = options;
    
    // Validate required parameters
    if (!apiId || apiId === "undefined" || apiId === "null" ) {
      console.error("Invalid API ID provided in client factory:", apiId);
      throw new Error("API ID cannot be empty or undefined");
    }
    
    if (!apiHash || apiHash === "undefined" || apiHash === "null" ) {
      console.error("Invalid API Hash provided in client factory");
      throw new Error("API Hash cannot be empty or undefined");
    }
    // removed trim from validations lol
    
    return new TelegramCombinedImplementation(
      apiId, 
      apiHash, 
      phoneNumber, 
      accountId, 
      sessionString
    );
  }
}
