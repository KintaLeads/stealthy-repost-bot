
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
  
  // Ensure apiId is a string first for validation
  const apiIdStr = String(apiId || "");
  
  // Validate inputs before creating client
  if (!apiIdStr || apiIdStr === "" || apiIdStr === "undefined" || apiIdStr === "null" || apiIdStr.trim() === "") {
    console.error(`Invalid API ID: ${apiId} (${typeof apiId})`);
    throw new Error(`API ID must be provided, got: ${apiId}`);
  }
  
  if (!apiHash || apiHash === "" || apiHash === "undefined" || apiHash === "null" || apiHash.trim() === "") {
    console.error(`Invalid API Hash (${typeof apiHash})`);
    throw new Error(`API Hash must be provided`);
  }
  
  // Parse string to number
  const numericApiId = parseInt(apiIdStr, 10);
  
  // Double-check numeric API ID
  if (isNaN(numericApiId) || numericApiId <= 0) {
    console.error(`Invalid API ID after conversion: ${apiId} -> ${numericApiId}`);
    throw new Error(`API ID must be a positive number, got: ${apiId}`);
  }
  
  console.log(`Initializing TelegramClient with:
    - API ID: ${numericApiId} (parsed from "${apiId}")
    - API Hash: ${apiHash.substring(0, 3)}... (length: ${apiHash.length})
    - Session: ${session ? 'provided' : 'none'}`);
  
  // Initialize string session
  const stringSession = new StringSession(session);
  
  try {
    // Create TelegramClient instance with validated numeric API ID
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
  } catch (error) {
    console.error("Error creating TelegramClient:", error);
    throw new Error(`Failed to create TelegramClient: ${error instanceof Error ? error.message : String(error)}`);
  }
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
