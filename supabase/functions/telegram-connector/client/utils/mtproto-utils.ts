
/**
 * Utility functions for MTProto client operations
 */
import { MTProto } from "../../proto/index.ts";

/**
 * Initialize an MTProto client with provided credentials
 */
export function initializeMTProto(apiId: string | number, apiHash: string, sessionString: string = ""): MTProto {
  try {
    console.log("=== INITIALIZING MTPROTO CLIENT ===");
    
    // Convert apiId to string for validation if it's not already
    const apiIdStr = String(apiId || "");
    
    // Log the values being passed in at the entry point
    console.log(`[MTPROTO-UTILS] initializeMTProto received:
      - apiId: ${apiId} (${typeof apiId})
      - apiHash: ${apiHash?.substring(0, 3)}... (${typeof apiHash}, length: ${apiHash?.length})
      - sessionString: ${sessionString ? 'provided' : 'none'}`);
    
    // Enhanced validation with descriptive messages
    if (!apiIdStr || apiIdStr === "undefined" || apiIdStr === "null" || apiIdStr.trim() === '') {
      console.error(`FATAL: Empty API ID before creating MTProto: "${apiId}" (${typeof apiId})`);
      throw new Error("API ID cannot be empty");
    }
    
    if (!apiHash || apiHash === "undefined" || apiHash === "null" || apiHash.trim() === '') {
      console.error(`FATAL: Empty API Hash before creating MTProto: "${apiHash}" (${typeof apiHash})`);
      throw new Error("API Hash cannot be empty");
    }
    
    // Convert apiId to number and validate
    const numericApiId = parseInt(apiIdStr, 10);
    if (isNaN(numericApiId) || numericApiId <= 0) {
      console.error(`FATAL: Invalid API ID format: "${apiId}" (parsed as ${numericApiId})`);
      throw new Error(`Invalid API ID format: "${apiId}". Must be a positive number.`);
    }
    
    console.log(`[MTPROTO-UTILS] After validation, using:
      - API ID: "${apiId}" (${typeof apiId}) -> ${numericApiId} (number)
      - API Hash: "${apiHash.substring(0, 3)}..." (length: ${apiHash.length})
      - Session: ${sessionString ? 'provided' : 'none'}`);
    
    // Add detailed logging right before creating the MTProto instance
    console.log(`[MTPROTO-UTILS] Creating MTProto with:
      - apiId: ${numericApiId} (${typeof numericApiId})
      - apiHash: ${apiHash} (${typeof apiHash})
      - session: ${sessionString ? 'has session' : 'no session'}`);
    
    const client = new MTProto({
      apiId: numericApiId, // Use the validated numeric version
      apiHash: apiHash.trim(),
      storageOptions: {
        session: sessionString
      }
    });
    
    console.log(`[MTPROTO-UTILS] MTProto client initialized successfully`);
    return client;
  } catch (error) {
    console.error("[MTPROTO-UTILS] Failed to initialize MTProto client:", error);
    console.error("[MTPROTO-UTILS] Stack trace:", error instanceof Error ? error.stack : "No stack trace");
    throw new Error(`Failed to initialize MTProto client: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Call an MTProto method with error handling and retry logic
 */
export async function callMTProtoMethod(
  client: MTProto, 
  method: string, 
  params: any = {}, 
  options: { retries?: number } = {}
): Promise<any> {
  const retries = options.retries ?? 1;
  let lastError: any = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`Calling MTProto method: ${method} (attempt ${attempt + 1}/${retries + 1})`);
      const result = await client.call(method, params);
      console.log(`MTProto method ${method} succeeded`);
      return result;
    } catch (error) {
      console.error(`Error calling MTProto method ${method} (attempt ${attempt + 1}/${retries + 1}):`, error);
      lastError = error;
      
      if (attempt < retries) {
        // Wait a bit before retrying
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All retries failed
  console.error(`All ${retries + 1} attempts to call ${method} failed`);
  return { error: lastError };
}
