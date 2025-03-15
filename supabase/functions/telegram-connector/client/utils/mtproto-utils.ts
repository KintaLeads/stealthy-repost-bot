
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
    
    // Log the values being passed in at the entry point
    console.log(`[MTPROTO-UTILS] initializeMTProto received:
      - apiId: ${apiId} (${typeof apiId})
      - apiHash: ${apiHash?.substring(0, 3)}... (${typeof apiHash}, length: ${apiHash?.length})
      - sessionString: ${sessionString ? 'provided' : 'none'} (length: ${sessionString ? sessionString.length : 0})`);
    
    // Enhanced validation with descriptive messages
    if (apiId === undefined || apiId === null) {
      console.error(`FATAL: Empty API ID before creating MTProto: "${apiId}" (${typeof apiId})`);
      throw new Error("API ID cannot be empty or undefined");
    }
    
    if (!apiHash || apiHash === "undefined" || apiHash === "null" || apiHash.trim() === '') {
      console.error(`FATAL: Empty API Hash before creating MTProto: "${apiHash}" (${typeof apiHash})`);
      throw new Error("API Hash cannot be empty");
    }
    
    // Convert apiId to number (if it's not already)
    const numericApiId = typeof apiId === 'number' ? apiId : parseInt(String(apiId), 10);
    if (isNaN(numericApiId) || numericApiId <= 0) {
      console.error(`FATAL: Invalid API ID format: "${apiId}" (parsed as ${numericApiId})`);
      throw new Error(`Invalid API ID format: "${apiId}". Must be a positive number.`);
    }
    
    console.log(`[MTPROTO-UTILS] After validation, using:
      - API ID: "${apiId}" (${typeof apiId}) -> ${numericApiId} (number)
      - API Hash: "${apiHash.substring(0, 3)}..." (length: ${apiHash.length})
      - Session: ${sessionString ? `provided (length: ${sessionString.length})` : 'none'}`);
    
    // Clean session string to ensure it's valid (not "[NONE]")
    const cleanSessionString = sessionString && sessionString !== "[NONE]" ? sessionString.trim() : "";
    
    // Add detailed logging right before creating the MTProto instance
    console.log(`[MTPROTO-UTILS] Creating MTProto with:
      - apiId: ${numericApiId} (${typeof numericApiId})
      - apiHash: ${apiHash} (${typeof apiHash})
      - session: ${cleanSessionString ? `has session (length: ${cleanSessionString.length})` : 'no session'}`);
    
    // IMPORTANT: Create a new object here to avoid reference issues
    const mtprotoOptions = {
      apiId: numericApiId, // Always use the numeric version
      apiHash: apiHash.trim(),
      storageOptions: {
        session: cleanSessionString
      }
    };
    
    // Double check the final values right before creation
    console.log(`[MTPROTO-UTILS] Final MTProto options:`, 
      JSON.stringify({
        apiId: mtprotoOptions.apiId,
        apiIdType: typeof mtprotoOptions.apiId,
        apiHashPrefix: mtprotoOptions.apiHash.substring(0, 3),
        apiHashLength: mtprotoOptions.apiHash.length,
        apiHashType: typeof mtprotoOptions.apiHash,
        sessionProvided: !!cleanSessionString,
        sessionLength: cleanSessionString.length
      })
    );
    
    const client = new MTProto(mtprotoOptions);
    
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
