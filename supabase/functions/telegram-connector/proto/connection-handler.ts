
/**
 * Handles connection to Telegram servers
 */
import { TelegramClient } from "https://esm.sh/telegram@2.19.10";

/**
 * Connect to Telegram servers
 */
export async function connectToTelegram(client: TelegramClient): Promise<void> {
  try {
    console.log("Connecting to Telegram servers...");
    await client.connect();
    console.log("Connected to Telegram servers successfully");
  } catch (error) {
    console.error("Connection error:", error);
    throw new Error(`Failed to connect to Telegram: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Disconnect from Telegram servers
 */
export async function disconnectFromTelegram(client: TelegramClient): Promise<void> {
  try {
    await client.disconnect();
    console.log("Disconnected from Telegram servers");
  } catch (error) {
    console.error("Error disconnecting:", error);
  }
}
