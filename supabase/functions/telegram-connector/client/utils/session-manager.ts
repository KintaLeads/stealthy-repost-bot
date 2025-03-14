
/**
 * Utilities for managing Telegram sessions
 */
import { MTProto } from "../../proto/index.ts";

/**
 * Export the current session
 */
export async function exportSession(client: MTProto): Promise<string> {
  if (!client) {
    console.warn("Cannot save session: Client not initialized");
    return "";
  }
  
  try {
    // Get the current session string
    console.log("Attempting to export session from client...");
    const sessionString = await client.exportSession();
    console.log("Session saved successfully (length: " + sessionString.length + ")");
    
    // Verify the session is valid
    if (!sessionString || typeof sessionString !== 'string') {
      console.warn("Warning: Exported session is invalid or empty");
      return "";
    }
    
    return sessionString;
  } catch (error) {
    console.error("Error saving session:", error);
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    throw new Error(`Failed to save session: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Check if the user is authenticated
 */
export async function checkAuthentication(client: MTProto): Promise<boolean> {
  try {
    // Try to get user info to check authentication status
    const result = await client.call('users.getFullUser', {
      id: {
        _: 'inputUserSelf'
      }
    });
    
    const authenticated = !result.error;
    console.log(`Authentication check: ${authenticated ? 'Authenticated' : 'Not authenticated'}`);
    return authenticated;
  } catch (error) {
    console.error("Error checking authentication status:", error);
    return false;
  }
}
