
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
  
  // Log the values being passed in
  console.log(`[CLIENT-INITIALIZER] Arguments received:
    - apiId: ${apiId} (${typeof apiId})
    - apiHash: ${apiHash?.substring(0, 3)}... (${typeof apiHash}, length: ${apiHash?.length})
    - session: ${session ? 'provided' : 'none'} (${typeof session})`);
  
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
    - Session: ${session ? 'provided' : 'none'}`);
  
  try {
    // Ensure session is a valid string (empty string if falsy)
    const cleanSessionString = session || "";
    
    // Create a new StringSession instance with the session string
    const stringSession = new StringSession(cleanSessionString);
    
    // Verify that stringSession is a valid StringSession instance
    if (!(stringSession instanceof StringSession)) {
      console.error("Failed to create a valid StringSession instance:", stringSession);
      throw new Error("Failed to create a valid StringSession instance");
    }
    
    console.log(`[CLIENT-INITIALIZER] Created StringSession instance:
      - Session string length: ${cleanSessionString.length}
      - Session instance type: ${stringSession.constructor.name}
      - Is StringSession instance: ${stringSession instanceof StringSession}`);
    
    // IMPORTANT: Always create new object here to avoid reference issues
    const clientOptions = {
      connectionRetries: 3,
      useWSS: true,
      requestRetries: 3,
    };
    
    console.log(`[CLIENT-INITIALIZER] Final client options:`, 
      JSON.stringify({
        apiId: numericApiId,
        apiIdType: typeof numericApiId,
        apiHashPrefix: apiHash.substring(0, 3),
        apiHashType: typeof apiHash,
        sessionType: stringSession.constructor.name
      })
    );
    
    // Create TelegramClient with the verified StringSession instance
    // Note: TelegramClient constructor MUST receive an INSTANCE of a StringSession, not a string
    const client = new TelegramClient(
      stringSession,     // StringSession instance (not a string)
      numericApiId,      // API ID as number
      apiHash,           // API Hash
      clientOptions      // Options
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
    if (!stringSession || !(stringSession instanceof StringSession)) {
      console.error("Invalid StringSession object provided to exportClientSession");
      throw new Error("Invalid StringSession object");
    }
    
    console.log("Exporting session, StringSession type:", stringSession.constructor.name);
    return stringSession.save();
  } catch (error) {
    console.error("Error exporting session:", error);
    throw error;
  }
}
