
// Request handling utilities for telegram-connector

/**
 * Enhanced CORS headers to handle cross-origin requests
 */
export const updatedCorsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
  'Access-Control-Expose-Headers': 'Content-Length, X-Telegram-Session'
};

/**
 * Handles CORS preflight requests
 */
export function handleCorsRequest(): Response {
  return new Response(null, {
    status: 204, // No content
    headers: updatedCorsHeaders
  });
}

/**
 * Parses and validates request body
 */
export async function parseRequestBody(req: Request): Promise<{
  valid: boolean;
  data?: any;
  error?: string;
}> {
  try {
    // Check if request has a body
    if (!req.body) {
      return { valid: false, error: "Request has no body" };
    }
    
    // Clone the request to ensure we don't consume the body
    const clonedReq = req.clone();

    // Attempt to parse JSON body
    const contentType = req.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      return { 
        valid: false, 
        error: `Invalid content type: ${contentType}. Expected application/json` 
      };
    }
    
    const rawText = await clonedReq.text();
    
    if (!rawText) {
      return { valid: false, error: "Empty request body" };
    }
    
    try {
      const data = JSON.parse(rawText);
      
      // Validate basic structure
      if (!data || typeof data !== 'object') {
        return { valid: false, error: "Invalid JSON: not an object" };
      }
      
      if (!data.operation) {
        return { valid: false, error: "Missing required parameter: operation" };
      }
      
      return { valid: true, data };
    } catch (jsonError) {
      return { 
        valid: false, 
        error: `Invalid JSON: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}` 
      };
    }
  } catch (error) {
    console.error("Error parsing request body:", error);
    return { 
      valid: false, 
      error: `Error parsing request: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

/**
 * Validates required API parameters
 */
export function validateApiParameters(
  apiId: any, 
  apiHash: string | undefined, 
  phoneNumber: string | undefined
): { 
  valid: boolean;
  error?: string; 
} {
  // Validate API ID
  if (!apiId) {
    return { valid: false, error: "Missing required parameter: apiId" };
  }
  
  const numericApiId = typeof apiId === 'number' ? apiId : parseInt(String(apiId), 10);
  
  if (isNaN(numericApiId) || numericApiId <= 0) {
    return { valid: false, error: `Invalid apiId: ${apiId} is not a valid positive number` };
  }
  
  // Validate API Hash
  if (!apiHash) {
    return { valid: false, error: "Missing required parameter: apiHash" };
  }
  
  if (typeof apiHash !== 'string' || apiHash.trim() === '') {
    return { valid: false, error: `Invalid apiHash: ${apiHash}` };
  }
  
  // Validate Phone Number
  if (!phoneNumber) {
    return { valid: false, error: "Missing required parameter: phoneNumber" };
  }
  
  if (typeof phoneNumber !== 'string' || phoneNumber.trim() === '') {
    return { valid: false, error: `Invalid phoneNumber: ${phoneNumber}` };
  }
  
  return { valid: true };
}
