
/**
 * Utility functions for MTProto client
 */

/**
 * Validate and convert API ID from various formats to a numeric value
 */
export function validateApiId(apiId: any): number {
  console.log(`[UTILS] Validating API ID: "${apiId}" (${typeof apiId})`);
  
  // First, convert to string if it's not already
  const apiIdStr = String(apiId);
  
  // Strict validation of API ID
  if (!apiIdStr || apiIdStr === "undefined" || apiIdStr === "null" || apiIdStr.trim() === "") {
    console.error(`[UTILS] CRITICAL ERROR: API ID is invalid: "${apiId}" (${typeof apiId})`);
    throw new Error(`API ID cannot be undefined or null, received: ${apiId}`);
  }
  
  // Parse the string to a number
  const numericApiId = parseInt(apiIdStr, 10);
  
  if (isNaN(numericApiId)) {
    console.error(`[UTILS] Failed to parse API ID string "${apiIdStr}" to number`);
    throw new Error(`Invalid API ID: "${apiIdStr}". Could not convert to number.`);
  }
  
  // Additional validation for API ID
  if (numericApiId <= 0) {
    console.error(`[UTILS] Invalid API ID after conversion: ${apiIdStr} -> ${numericApiId}`);
    throw new Error(`Invalid API ID: ${numericApiId}. Must be a positive number.`);
  }
  
  console.log(`[UTILS] API ID validated successfully: ${numericApiId} (${typeof numericApiId})`);
  return numericApiId;
}

/**
 * Validate API Hash
 */
export function validateApiHash(apiHash: any): string {
  console.log(`[UTILS] Validating API Hash (length: ${apiHash?.length || 0})`);
  
  // Convert to string if not already
  const apiHashStr = String(apiHash || "");
  
  // Strict validation of API Hash
  if (!apiHashStr || apiHashStr === "undefined" || apiHashStr === "null" || apiHashStr.trim() === '') {
    console.error(`[UTILS] CRITICAL ERROR: API Hash is invalid: "${apiHash}" (${typeof apiHash})`);
    throw new Error(`API Hash cannot be undefined, null or empty, received: ${apiHash}`);
  }
  
  console.log(`[UTILS] API Hash validated successfully: ${apiHashStr.substring(0, 3)}... (length: ${apiHashStr.length})`);
  return apiHashStr.trim();
}

/**
 * Clean a session string, handling special cases like "[NONE]" or "[none]"
 * This is the central session cleaning function used throughout the app
 */
export function cleanSessionString(session: string | null | undefined): string {
  // CRITICAL FIX: Always check for "[NONE]" using case-insensitive regex
  if (!session || /^\[NONE\]$/i.test(session) || session.trim() === '') {
    console.log(`[UTILS] cleanSessionString: Input "${session}" converted to empty string`);
    return "";
  }
  
  const trimmed = session.trim();
  console.log(`[UTILS] cleanSessionString: Input "${session}" cleaned to "${trimmed}" (${trimmed.length} chars)`);
  return trimmed;
}
