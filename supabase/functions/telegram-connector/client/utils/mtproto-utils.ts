
/**
 * Utility functions for MTProto client operations
 */
import { MTProto } from "../../proto/index.ts";

/**
 * Initialize an MTProto client with provided credentials
 */
export function initializeMTProto(apiId: string, apiHash: string, sessionString: string = ""): MTProto {
  try {
    console.log("=== INITIALIZING MTPROTO CLIENT ===");
    
    // Enhanced validation with descriptive messages
    if (!apiId || apiId === "undefined" || apiId === "null" || apiId.trim() === '') {
      console.error("FATAL: Empty API ID before creating MTProto:", apiId);
      throw new Error("API ID cannot be empty");
    }
    
    if (!apiHash || apiHash === "undefined" || apiHash === "null" || apiHash.trim() === '') {
      console.error("FATAL: Empty API Hash before creating MTProto");
      throw new Error("API Hash cannot be empty");
    }
    
    // Convert apiId to number and validate
    const numericApiId = parseInt(apiId, 10);
    if (isNaN(numericApiId) || numericApiId <= 0) {
      console.error(`FATAL: Invalid API ID format: "${apiId}" (parsed as ${numericApiId})`);
      throw new Error(`Invalid API ID format: "${apiId}". Must be a positive number.`);
    }
    
    console.log(`Initializing MTProto with:
      - API ID: "${apiId}" (${typeof apiId}) -> ${numericApiId} (number)
      - API Hash: "${apiHash.substring(0, 3)}..." (length: ${apiHash.length})
      - Session: ${sessionString ? 'provided' : 'none'}`);
    
    const client = new MTProto({
      apiId: numericApiId, // Use the validated numeric version
      apiHash: apiHash.trim(),
      storageOptions: {
        session: sessionString
      }
    });
    
    console.log("MTProto client initialized successfully");
    return client;
  } catch (error) {
    console.error("Failed to initialize MTProto client:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace");
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
