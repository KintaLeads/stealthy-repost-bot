
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
    const sessionString = await client.exportSession();
    console.log("Session saved successfully (length: " + sessionString.length + ")");
    return sessionString;
  } catch (error) {
    console.error("Error saving session:", error);
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

