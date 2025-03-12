
// Main entry point for Telegram client
import { TelegramClientFactory } from "./client-factory.ts";
import { TelegramClientInterface, TelegramClientOptions, AuthState } from "./types.ts";

// Re-export types for external use
export { type TelegramClientInterface, type TelegramClientOptions, type AuthState } from "./types.ts";

/**
 * Creates a new Telegram client instance with the provided options
 */
export function createTelegramClient(options: TelegramClientOptions): TelegramClientInterface {
  return TelegramClientFactory.createClient(options);
}
