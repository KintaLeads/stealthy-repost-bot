
// Error handling utilities for the Telegram connector functions

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  error: unknown, 
  status: number = 500, 
  corsHeaders: Record<string, string>
): Response {
  console.error('Error in Telegram connector:', error);
  
  const errorMessage = error instanceof Error 
    ? error.message 
    : "An unknown error occurred";
    
  const errorStack = error instanceof Error 
    ? error.stack 
    : "No stack trace available";
    
  return new Response(
    JSON.stringify({ 
      error: errorMessage,
      detailed: errorStack,
      success: false
    }),
    { 
      status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

/**
 * Creates a standardized bad request response for validation errors
 */
export function createBadRequestResponse(
  message: string,
  corsHeaders: Record<string, string>
): Response {
  return new Response(
    JSON.stringify({ 
      error: message,
      success: false
    }),
    { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

/**
 * Validates required parameters for Telegram API operations
 */
export function validateRequiredParams(
  apiId: string | undefined,
  apiHash: string | undefined,
  phoneNumber: string | undefined
): { isValid: boolean; missingParams: string[] } {
  const missingParams = [];
  
  if (!apiId) missingParams.push('apiId');
  if (!apiHash) missingParams.push('apiHash');
  if (!phoneNumber) missingParams.push('phoneNumber');
  
  return {
    isValid: missingParams.length === 0,
    missingParams
  };
}

/**
 * Checks if the Telegram version is supported
 */
export function validateTelegramVersion(
  version: string | undefined,
  supportedVersions: string[]
): boolean {
  if (!version) return false;
  return supportedVersions.includes(version);
}
