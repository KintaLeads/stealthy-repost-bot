
/**
 * Utilities for managing Telegram sessions
 */
import { MTProto } from "../../proto/index.ts";

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
