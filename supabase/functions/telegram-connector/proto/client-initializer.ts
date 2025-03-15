
/**
 * Handles Telegram client initialization
 */
import { TelegramClient } from "https://esm.sh/telegram@2.19.10";
import { StringSession } from "https://esm.sh/telegram@2.19.10/sessions/index.js";

/**
 * Initialize a new Telegram client instance
 */
export function initializeTelegramClient(
  apiId: number | string,
  apiHash: string,
  session: string = ""
): { client: TelegramClient; stringSession: StringSession } {
  console.log("Creating TelegramClient instance...");
  
  // Log the values being passed in
  console.log(`[CLIENT-INITIALIZER] Arguments received:
    - apiId: ${apiId} (${typeof apiId})
    - apiHash: ${apiHash?.substring(0, 3)}... (${typeof apiHash}, length: ${apiHash?.length})
    - session: ${session ? `length: ${session.length}` : 'empty string'} (${typeof session})`);
  
  // Validate inputs before creating client
  if (apiId === undefined || apiId === null) {
    console.error(`Invalid API ID: ${apiId} (${typeof apiId})`);
    throw new Error(`API ID must be provided, got: ${apiId}`);
  }
  
  if (!apiHash || apiHash === "" || apiHash === "undefined" || apiHash === "null" || apiHash.trim() === "") {
    console.error(`Invalid API Hash (${typeof apiHash})`);
    throw new Error(`API Hash must be provided`);
  }
  
  // Parse string to number if needed
  const numericApiId = typeof apiId === 'number' ? apiId : parseInt(String(apiId), 10);
  
  // Double-check numeric API ID
  if (isNaN(numericApiId) || numericApiId <= 0) {
    console.error(`Invalid API ID after conversion: ${apiId} -> ${numericApiId}`);
    throw new Error(`API ID must be a positive number, got: ${apiId}`);
  }
  
  console.log(`Initializing TelegramClient with:
    - API ID: ${numericApiId} (parsed from "${apiId}")
    - API Hash: ${apiHash.substring(0, 3)}... (length: ${apiHash.length})
    - Session: ${session ? `length: ${session.length}` : 'empty string'}`);
  
  try {
    // Create a fresh StringSession with the provided session string
    const cleanSession = session || "";
    const stringSession = new StringSession(cleanSession);
    
    console.log(`Created StringSession successfully.
      - Session string length: ${cleanSession.length}
      - StringSession type: ${typeof stringSession}
      - StringSession constructor: ${stringSession.constructor.name}
      - Is StringSession instance: ${stringSession instanceof StringSession}`);
    
    // Create TelegramClient with the StringSession instance
    const client = new TelegramClient(
      stringSession,     // StringSession instance
      numericApiId,      // API ID as number
      apiHash,           // API Hash
      {                  // Options
        connectionRetries: 3,
        useWSS: true,
        requestRetries: 3
      }
    );
    
    console.log(`Telegram client initialized successfully with apiId: ${numericApiId}`);
    
    return { client, stringSession };
  } catch (error) {
    console.error("Error creating TelegramClient:", error);
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
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
    if (!stringSession) {
      console.error("Invalid StringSession object provided to exportClientSession");
      throw new Error("Invalid StringSession object");
    }
    
    console.log("Exporting session, StringSession type:", stringSession.constructor.name);
    
    // Save the session to a string
    const sessionString = stringSession.save();
    console.log(`Session exported successfully, length: ${sessionString.length}`);
    
    // Return the exported session string
    return sessionString;
  } catch (error) {
    console.error("Error exporting session:", error);
    throw error;
  }
}
