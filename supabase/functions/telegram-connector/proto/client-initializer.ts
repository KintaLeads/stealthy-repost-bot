
/**
 * Handles Telegram client initialization
 */
import { TelegramClient } from "telegram";
import { StringSession } from "https://esm.sh/telegram@2.19.10/sessions";

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
  
  // CRITICAL FIX: Enhanced session validation with regex
  const sessionValue = session || "";
  let cleanSessionString = "";
  
  // Check for "[NONE]" in any case combination
  if (sessionValue && !/^\[NONE\]$/i.test(sessionValue)) {
    cleanSessionString = sessionValue.trim();
  }
  
  console.log(`[CLIENT-INITIALIZER] Session validation:
    - Original: "${sessionValue}" (${typeof sessionValue}, length: ${sessionValue.length})
    - Cleaned: "${cleanSessionString}" (length: ${cleanSessionString.length})
    - Is valid: ${cleanSessionString !== "" && !/^\[NONE\]$/i.test(cleanSessionString)}`);
  
  console.log(`Initializing TelegramClient with:
    - API ID: ${numericApiId} (parsed from "${apiId}")
    - API Hash: ${apiHash.substring(0, 3)}... (length: ${apiHash.length})
    - Session: ${cleanSessionString ? `length: ${cleanSessionString.length}` : 'empty string'}`);
  
  try {
    // Create a StringSession instance
    const stringSession = new StringSession(cleanSessionString);
    console.log(`Created StringSession object type: ${typeof stringSession}`);
    console.log(`StringSession constructor: ${stringSession.constructor.name}`);
    
    // Validate that we've created a proper StringSession instance
    if (!stringSession || typeof stringSession !== 'object') {
      console.error("Failed to create StringSession instance:", stringSession);
      throw new Error('Failed to create a proper StringSession instance');
    }
    
    // IMPORTANT: Create a new TelegramClient with the StringSession
    const client = new TelegramClient(
      stringSession,         // The StringSession object
      numericApiId,          // API ID as number
      apiHash,               // API Hash
      {                      // Options
        connectionRetries: 5,
        useWSS: true,
        requestRetries: 3
      }
    );
    
    // Log successful creation
    console.log(`TelegramClient created successfully using StringSession`);
    console.log(`StringSession save() result: ${stringSession.save()}`);
    
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
    
    // Make sure we never return "[NONE]"
    if (!sessionString || /^\[NONE\]$/i.test(sessionString)) {
      console.log("Session exported as [NONE], returning empty string instead");
      return "";
    }
    
    console.log(`Session exported successfully, length: ${sessionString.length}`);
    
    // Return the exported session string
    return sessionString;
  } catch (error) {
    console.error("Error exporting session:", error);
    throw error;
  }
}
