
/**
 * Handles Telegram client initialization
 */
import { TelegramClient } from "https://esm.sh/telegram@2.19.10";
import { StringSession } from "https://esm.sh/telegram/sessions";

/**
 * Initialize a new Telegram client instance
 */
export function initializeTelegramClient(
  apiId: number,
  apiHash: string,
  session: string = ""
): { client: TelegramClient; stringSession: StringSession } {
  console.log("Creating TelegramClient instance...");
  
  // Initialize string session
  const stringSession = new StringSession(session);
  
  // Create TelegramClient instance
  const client = new TelegramClient({
    apiId: apiId,
    apiHash: apiHash,
    session: stringSession,
    connectionRetries: 3,
    useWSS: true,
    requestRetries: 3,
  });
  
  console.log("Telegram client initialized successfully");
  
  return { client, stringSession };
}

/**
 * Export current session as a string
 */
export async function exportClientSession(
  stringSession: StringSession
): Promise<string> {
  try {
    return stringSession.save();
  } catch (error) {
    console.error("Error exporting session:", error);
    throw error;
  }
}
