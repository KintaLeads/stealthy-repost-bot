
/**
 * Handles Telegram client initialization
 */
import { TelegramClient } from "https://esm.sh/telegram@2.19.10";
import { StringSession } from "https://esm.sh/telegram/sessions";

/**
 * Initialize a new Telegram client instance
 */
export function initializeTelegramClient(
  apiId: number | string,
  apiHash: string,
  session: string = ""
): { client: TelegramClient; stringSession: StringSession } {
  console.log("Creating TelegramClient instance...");
  
  // Ensure apiId is a number
  const numericApiId = typeof apiId === 'string' ? parseInt(apiId, 10) : apiId;
  
  // Validate numeric API ID
  if (isNaN(numericApiId) || numericApiId <= 0) {
    console.error(`Invalid API ID: ${apiId} (${typeof apiId})`);
    throw new Error(`API ID must be a positive number, got: ${apiId}`);
  }
  
  // Initialize string session
  const stringSession = new StringSession(session);
  
  // Create TelegramClient instance with numeric API ID
  const client = new TelegramClient({
    apiId: numericApiId,
    apiHash: apiHash,
    session: stringSession,
    connectionRetries: 3,
    useWSS: true,
    requestRetries: 3,
  });
  
  console.log(`Telegram client initialized successfully with apiId: ${numericApiId}`);
  
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
