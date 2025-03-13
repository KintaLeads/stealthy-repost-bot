
/**
 * Request handling utilities for the Telegram connector functions
 */

// CORS headers for cross-origin requests
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-telegram-session',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Expose-Headers': 'Content-Length, X-Telegram-Session',
  'Access-Control-Max-Age': '86400',
};

// Updated CORS headers with extra fields
export const updatedCorsHeaders = {
  ...corsHeaders,
  'Content-Type': 'application/json'
};

/**
 * Handle CORS preflight requests
 */
export function handleCorsRequest(): Response {
  console.log("Handling OPTIONS request for CORS with proper headers");
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

/**
 * Parse and validate the request body
 * @param req The original request
 * @returns Object containing validity status and parsed data
 */
export async function parseRequestBody(req: Request): Promise<{ valid: boolean; data: any; error?: string }> {
  try {
    // Clone the request before reading the body
    const reqClone = req.clone();
    
    // Try to read the request text
    let bodyText = '';
    try {
      bodyText = await reqClone.text();
      console.log(`Request body (${bodyText.length} chars):`, bodyText.substring(0, 100) + (bodyText.length > 100 ? '...' : ''));
    } catch (readError) {
      console.error("Error reading request body:", readError);
      return {
        valid: false,
        data: null,
        error: `Failed to read request body: ${readError instanceof Error ? readError.message : String(readError)}`
      };
    }
    
    // Check if the body is empty
    if (!bodyText || bodyText.trim() === '') {
      console.error("Request body is empty or only whitespace");
      return {
        valid: false,
        data: null,
        error: 'Request body is empty'
      };
    }
    
    // Try to parse the body as JSON
    try {
      const data = JSON.parse(bodyText);
      console.log("Successfully parsed JSON body, keys:", Object.keys(data));
      return {
        valid: true,
        data
      };
    } catch (parseError) {
      console.error("Failed to parse JSON:", parseError);
      return {
        valid: false,
        data: bodyText,
        error: `Invalid JSON format: ${parseError instanceof Error ? parseError.message : String(parseError)}`
      };
    }
  } catch (error) {
    console.error("Unexpected error in parseRequestBody:", error);
    return {
      valid: false,
      data: null,
      error: `Error processing request: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Validates that the API parameters are correct
 */
export function validateApiParameters(apiId: string, apiHash: string, phoneNumber: string): { 
  valid: boolean; 
  error?: string;
  details?: Record<string, any>; 
} {
  const errors = [];
  const details: Record<string, any> = {};
  
  // Check apiId
  if (!apiId) {
    errors.push('API ID is required');
    details.apiId = 'missing';
  } else if (!/^\d+$/.test(apiId)) {
    errors.push('API ID must be a numeric value');
    details.apiId = 'invalid_format';
  }
  
  // Check apiHash
  if (!apiHash) {
    errors.push('API Hash is required');
    details.apiHash = 'missing';
  } else if (apiHash.length < 10) {
    errors.push('API Hash seems too short');
    details.apiHash = 'suspicious_length';
  }
  
  // Check phoneNumber
  if (!phoneNumber) {
    errors.push('Phone number is required');
    details.phoneNumber = 'missing';
  } else if (!/^\+?\d{10,15}$/.test(phoneNumber.replace(/\s+/g, ''))) {
    errors.push('Phone number must be in international format (e.g. +1234567890)');
    details.phoneNumber = 'invalid_format';
  }
  
  return {
    valid: errors.length === 0,
    error: errors.length > 0 ? errors.join('; ') : undefined,
    details: Object.keys(details).length > 0 ? details : undefined
  };
}

/**
 * Debug utility to check a value with type information
 */
export function debugCheckValue(name: string, value: any): void {
  console.log(`Value check - ${name}:`);
  console.log(`  - Type: ${typeof value}`);
  console.log(`  - Value: ${value}`);
  
  if (typeof value === 'string') {
    console.log(`  - Length: ${value.length}`);
    console.log(`  - Empty: ${value.trim() === ''}`);
  } else if (value === null) {
    console.log('  - Is null');
  } else if (value === undefined) {
    console.log('  - Is undefined');
  } else if (Array.isArray(value)) {
    console.log(`  - Is array of length ${value.length}`);
  } else if (typeof value === 'object') {
    console.log(`  - Is object with keys: ${Object.keys(value).join(', ')}`);
  }
}
