
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
    - session: ${session ? 'provided' : 'none'}`);
  
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
    // Initialize StringSession correctly - using empty string if no session provided
    const cleanSessionString = session || "";
    const stringSession = new StringSession(cleanSessionString);
    
    console.log(`[CLIENT-INITIALIZER] Created StringSession instance:
      - Session string length: ${cleanSessionString.length}
      - Session instance type: ${stringSession.constructor.name}
      - Is StringSession instance: ${stringSession instanceof StringSession}`);
    
    // Create TelegramClient instance with validated numeric API ID
    console.log(`[CLIENT-INITIALIZER] About to create TelegramClient:
      - apiId: ${numericApiId} (type: ${typeof numericApiId})
      - apiHash: ${apiHash.substring(0, 3)}... (type: ${typeof apiHash})
      - session: Instance of ${stringSession.constructor.name}`);
      
    // IMPORTANT: Always create new object here to avoid reference issues
    const clientOptions = {
      connectionRetries: 3,
      useWSS: true,
      requestRetries: 3,
    };
    
    // Verify stringSession is a valid instance before proceeding
    if (!(stringSession instanceof StringSession)) {
      throw new Error(`Failed to create a proper StringSession instance`);
    }
    
    console.log(`[CLIENT-INITIALIZER] Final client options:`, 
      JSON.stringify({
        apiId: numericApiId,
        apiIdType: typeof numericApiId,
        apiHashPrefix: apiHash.substring(0, 3),
        apiHashType: typeof apiHash,
        sessionType: stringSession.constructor.name
      })
    );
    
    // Explicitly pass the StringSession instance as the first parameter
    const client = new TelegramClient(
      stringSession,     // Session - must be a StringSession instance
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
