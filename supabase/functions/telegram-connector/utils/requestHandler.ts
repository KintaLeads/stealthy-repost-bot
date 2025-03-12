import { corsHeaders } from "../../_shared/cors.ts";
import { createBadRequestResponse, createErrorResponse } from "./errorHandler.ts";

// Debug function to check if a string value is valid
export function debugCheckValue(name: string, value: any): void {
  console.log(`DEBUG CHECK - ${name}:`);
  console.log(`  Type: ${typeof value}`);
  console.log(`  Value: "${String(value)}"`);
  console.log(`  Length: ${typeof value === 'string' ? value.length : 'N/A'}`);
  console.log(`  Is empty: ${!value}`);
  console.log(`  Is undefined: ${value === undefined}`);
  console.log(`  Is null: ${value === null}`);
  console.log(`  Is 'undefined' string: ${value === 'undefined'}`);
  console.log(`  Is 'null' string: ${value === 'null'}`);
  console.log(`  Passes basic validity: ${value && value !== 'undefined' && value !== 'null' && String(value).trim() !== ''}`);
  
  // Check value after trimming and conversion to number if applicable
  if (typeof value === 'string') {
    const trimmed = value.trim();
    console.log(`  After trim: "${trimmed}" (length: ${trimmed.length})`);
    
    // If this is potentially a numeric field, check numeric conversion
    if (name.toLowerCase().includes('id')) {
      const asNumber = Number(trimmed);
      console.log(`  As number: ${asNumber} (isNaN: ${isNaN(asNumber)})`);
    }
  }
}

// Debug function to stringifyValues while hiding sensitive data
export function debugStringifyRequestBody(body: any): string {
  // Create a copy to avoid modifying original
  const sanitizedBody = { ...body };
  
  // Mask sensitive fields but keep length information
  if (sanitizedBody.apiHash) {
    const length = String(sanitizedBody.apiHash).length;
    sanitizedBody.apiHash = `[HIDDEN:${length} chars]`;
  }
  
  if (sanitizedBody.verificationCode) {
    sanitizedBody.verificationCode = '[HIDDEN]';
  }
  
  return JSON.stringify(sanitizedBody, null, 2);
}

// Updated corsHeaders with both standard and content-type
export const updatedCorsHeaders = {
  ...corsHeaders,
  'Access-Control-Expose-Headers': 'X-Telegram-Session'
};

// Handle CORS preflight requests
export function handleCorsRequest(): Response {
  console.log("Handling OPTIONS request for CORS with proper headers");
  return new Response(null, {
    headers: updatedCorsHeaders,
    status: 204
  });
}

// Parse request body
export async function parseRequestBody(req: Request): Promise<{ success: boolean; body?: any; response?: Response }> {
  try {
    const text = await req.text();
    console.log("Raw request body:", text);
    
    // Handle empty body case
    if (!text.trim()) {
      return { 
        success: false, 
        response: createBadRequestResponse('Empty request body', updatedCorsHeaders) 
      };
    }
    
    const requestBody = JSON.parse(text);
    console.log("Request body:", debugStringifyRequestBody(requestBody));
    
    return { success: true, body: requestBody };
  } catch (parseError) {
    console.error("⚠️ Failed to parse request body:", parseError);
    return { 
      success: false, 
      response: createBadRequestResponse('Invalid request format: Could not parse JSON body', updatedCorsHeaders) 
    };
  }
}

// Validate API parameters
export function validateApiParameters(apiId: string, apiHash: string, phoneNumber: string): { isValid: boolean; response?: Response } {
  // Pre-validation trim
  const trimmedApiId = typeof apiId === 'string' ? apiId.trim() : apiId;
  const trimmedApiHash = typeof apiHash === 'string' ? apiHash.trim() : apiHash;
  const trimmedPhoneNumber = typeof phoneNumber === 'string' ? phoneNumber.trim() : phoneNumber;
  
  // Log trimmed values
  console.log("VALUES AFTER TRIMMING:");
  console.log(`apiId: "${trimmedApiId}" (length: ${typeof trimmedApiId === 'string' ? trimmedApiId.length : 'N/A'})`);
  console.log(`apiHash: "${trimmedApiHash ? trimmedApiHash.substring(0, 3) + '...' : ''}" (length: ${typeof trimmedApiHash === 'string' ? trimmedApiHash.length : 'N/A'})`);
  console.log(`phoneNumber: "${trimmedPhoneNumber}" (length: ${typeof trimmedPhoneNumber === 'string' ? trimmedPhoneNumber.length : 'N/A'})`);
  
  // Basic parameter validation
  if (trimmedApiId === 'undefined' || trimmedApiId === 'null' || trimmedApiId === '') {
    console.error("⚠️ API ID is empty or invalid:", trimmedApiId);
    return {
      isValid: false,
      response: createBadRequestResponse(
        `Invalid API ID. Please ensure a valid apiId is provided.`,
        updatedCorsHeaders
      )
    };
  }
  
  if (trimmedApiHash === 'undefined' || trimmedApiHash === 'null' || trimmedApiHash === '') {
    console.error("⚠️ API Hash is empty or invalid");
    return {
      isValid: false,
      response: createBadRequestResponse(
        `Invalid API Hash. Please ensure a valid apiHash is provided.`,
        updatedCorsHeaders
      )
    };
  }
  
  // Verify API ID is numeric
  const apiIdNum = Number(trimmedApiId);
  if (isNaN(apiIdNum) || apiIdNum <= 0) {
    console.error("⚠️ API ID is not a valid positive number:", trimmedApiId);
    return {
      isValid: false,
      response: createBadRequestResponse(
        `Invalid API ID format. Expected a positive number, got: ${trimmedApiId}`,
        updatedCorsHeaders
      )
    };
  }
  
  // Verify API Hash has reasonable length (Telegram hashes are typically 32 chars)
  if (typeof trimmedApiHash === 'string' && trimmedApiHash.length < 5) {
    console.error("⚠️ API Hash is suspiciously short:", trimmedApiHash.length, "characters");
    return {
      isValid: false,
      response: createBadRequestResponse(
        `Invalid API Hash format. Hash appears to be too short: ${trimmedApiHash.length} characters`,
        updatedCorsHeaders
      )
    };
  }
  
  return { isValid: true };
}
