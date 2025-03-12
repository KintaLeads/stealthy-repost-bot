
/**
 * Utility functions for MTProto client
 */

/**
 * Validate and convert API ID from various formats to a numeric value
 */
export function validateApiId(apiId: any): number {
  console.log(`Validating API ID: "${apiId}" (${typeof apiId})`);
  
  // Strict validation of API ID
  if (!apiId || apiId === undefined || apiId === null) {
    console.error(`CRITICAL ERROR: API ID is invalid: "${apiId}"`);
    throw new Error(`API ID cannot be undefined or null, received: ${apiId}`);
  }
  
  // Ensure API ID is a number 
  let numericApiId: number;
  if (typeof apiId === 'string') {
    console.log(`API ID is a string (${apiId}), converting to number`);
    numericApiId = parseInt(apiId, 10);
    
    if (isNaN(numericApiId)) {
      console.error(`Failed to parse API ID string "${apiId}" to number`);
      throw new Error(`Invalid API ID: "${apiId}". Could not convert to number.`);
    }
  } else if (typeof apiId === 'number') {
    numericApiId = apiId;
  } else {
    // Try to convert other types
    console.log(`API ID is not a string or number, attempting conversion`);
    const converted = Number(apiId);
    if (isNaN(converted)) {
      console.error(`Failed to convert API ID to number: ${apiId}`);
      throw new Error(`Invalid API ID: Could not convert to number.`);
    }
    numericApiId = converted;
  }
  
  // Additional validation for API ID
  if (isNaN(numericApiId) || numericApiId <= 0) {
    console.error(`Invalid API ID: ${numericApiId}`);
    throw new Error(`Invalid API ID: ${numericApiId}. Must be a positive number.`);
  }
  
  return numericApiId;
}

/**
 * Validate API Hash
 */
export function validateApiHash(apiHash: any): string {
  console.log(`Validating API Hash (length: ${apiHash?.length || 0})`);
  
  // Strict validation of API Hash
  if (!apiHash || apiHash === undefined || apiHash === null || apiHash.trim() === '') {
    console.error(`CRITICAL ERROR: API Hash is invalid: "${apiHash}"`);
    throw new Error(`API Hash cannot be undefined, null or empty, received: ${apiHash}`);
  }
  
  return apiHash.trim();
}
