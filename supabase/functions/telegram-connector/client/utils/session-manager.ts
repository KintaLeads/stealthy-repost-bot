
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
    
    // CRITICAL FIX: More thorough validation with regex
    // Verify the session is valid - NEVER use "[NONE]" or any variation
    if (!sessionString || 
        typeof sessionString !== 'string' || 
        /^\[NONE\]$/i.test(sessionString) ||
        sessionString.trim() === '') {
      console.warn(`Warning: Exported session is invalid or empty: "${sessionString}"`);
      return "";
    }
    
    const trimmedSession = sessionString.trim();
    console.log("Session exported successfully (length: " + trimmedSession.length + ")");
    return trimmedSession;
  } catch (error) {
    console.error("Error saving session:", error);
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    // Return empty string on error, don't propagate the error
    return "";
  }
}

/**
 * Check if the user is authenticated
 */
export async function checkAuthentication(client: MTProto): Promise<boolean> {
  try {
    // Try to get user info to check authentication status
    const result = await client.call('users.getMe', {});
    
    const authenticated = !result.error;
    console.log(`Authentication check: ${authenticated ? 'Authenticated' : 'Not authenticated'}`);
    return authenticated;
  } catch (error) {
    console.error("Error checking authentication status:", error);
    return false;
  }
}
