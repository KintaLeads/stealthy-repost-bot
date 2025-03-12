
// Main entry point for Telegram client
import { TelegramClientFactory } from "./client-factory.ts";
import { TelegramClientInterface, TelegramClientOptions } from "./types.ts";

// Re-export AuthState type for external use
export { type AuthState } from "./base-client.ts";
export { type TelegramClientInterface, type TelegramClientOptions } from "./types.ts";

/**
 * Creates a new Telegram client instance with the provided options
 */
export function createTelegramClient(options: TelegramClientOptions): TelegramClientInterface {
  return TelegramClientFactory.createClient(options);
}
