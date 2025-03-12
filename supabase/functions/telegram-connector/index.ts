
// Main function handler for Telegram connector
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createErrorResponse, validateRequiredParams } from './utils/errorHandler.ts';
import { 
  updatedCorsHeaders, 
  handleCorsRequest, 
  parseRequestBody, 
  validateApiParameters, 
  debugCheckValue 
} from './utils/requestHandler.ts';
import { 
  logEnvironmentInfo, 
  logSupabaseConfig, 
  logRequestInfo, 
  logExecutionComplete 
} from './utils/logger.ts';
import { handleHealthcheck } from './utils/healthcheck.ts';
import { routeOperation } from './router.ts';

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Log startup information
console.log("🚀 Telegram connector function starting");
console.log("Supabase URL length:", supabaseUrl?.length || 0);
console.log("Supabase Key length:", supabaseKey?.length || 0);

Deno.serve(async (req) => {
  // Measure function execution time
  const startTime = Date.now();
  
  // Log that the function was called with detailed info
  logRequestInfo(req);
  
  // Enhanced CORS handling with better debug information
  if (req.method === 'OPTIONS') {
    console.log("📡 Handling CORS OPTIONS request");
    console.log("CORS Headers being returned:", updatedCorsHeaders);
    return handleCorsRequest();
  }

  try {
    // Print Deno and environment information for debugging
    logEnvironmentInfo();
    
    // Log if we have the required Supabase environment variables
    logSupabaseConfig(supabaseUrl, supabaseKey);
    
    // Parse the request body
    const { success: parseSuccess, body: requestBody, response: parseErrorResponse } = await parseRequestBody(req);
    if (!parseSuccess) {
      console.error("❌ Failed to parse request body");
      return parseErrorResponse!;
    }
    
    const { 
      apiId, 
      apiHash, 
      phoneNumber, 
      accountId, 
      sourceChannels, 
      operation, 
      messageId, 
      sourceChannel, 
      targetChannel, 
      verificationCode,
      sessionString,
      debug
    } = requestBody;
    
    // Detailed logging to track what we're working with
    console.log("📦 REQUEST EXTRACTION DEBUG 📦");
    console.log(`Operation: "${operation || 'not provided'}"`);
    console.log(`Request URL: ${req.url}`);
    
    // Debug check for all critical parameters
    debugCheckValue("apiId", apiId);
    debugCheckValue("apiHash", apiHash); 
    debugCheckValue("phoneNumber", phoneNumber);
    debugCheckValue("accountId", accountId);
    debugCheckValue("sessionString", sessionString);
    
    // Handle healthcheck operation directly
    if (operation === 'healthcheck') {
      console.log("🏥 Handling healthcheck request");
      return handleHealthcheck(updatedCorsHeaders);
    }
    
    // Validate required parameters based on operation type
    if (operation === 'validate' || operation === 'connect') {
      // Validate the API parameters
      const { isValid, response: validationErrorResponse } = validateApiParameters(apiId, apiHash, phoneNumber);
      if (!isValid) {
        console.error("❌ API parameter validation failed");
        return validationErrorResponse!;
      }
      
      // More detailed validation using the validateRequiredParams function
      const paramValidation = validateRequiredParams(apiId, apiHash, phoneNumber);
      if (!paramValidation.isValid) {
        console.error("⚠️ Missing required parameters:", paramValidation.missingParams);
        return createErrorResponse(
          `Missing required Telegram API credentials: ${paramValidation.missingParams.join(', ')}. Please ensure apiId, apiHash, and phoneNumber are provided.`,
          400,
          updatedCorsHeaders
        );
      }
    }

    // Get session from headers if available or from request body
    const headerSessionString = req.headers.get('X-Telegram-Session') || '';
    const effectiveSessionString = headerSessionString || sessionString || '';
    
    console.log("Session provided:", effectiveSessionString ? "Yes (length: " + effectiveSessionString.length + ")" : "No");
    
    // Log the exact parameters we're using for initialization
    console.log("🚨 FINAL VALUES FOR CLIENT INITIALIZATION 🚨");
    // Be careful not to log the full apiHash for security
    const safeApiHash = typeof apiHash === 'string' ? 
      `${apiHash.substring(0, 3)}...[${apiHash.length} chars]` : 
      String(apiHash);
    
    console.log({
      apiId: typeof apiId === 'string' ? apiId.trim() : apiId,
      apiHash: safeApiHash,
      phoneNumber: typeof phoneNumber === 'string' ? phoneNumber.trim() : phoneNumber,
      accountId: accountId || 'temp'
    });
    
    // Create trimmed versions of the parameters
    const trimmedApiId = typeof apiId === 'string' ? apiId.trim() : String(apiId).trim();
    const trimmedApiHash = typeof apiHash === 'string' ? apiHash.trim() : String(apiHash).trim();
    const trimmedPhoneNumber = phoneNumber ? String(phoneNumber).trim() : '';
    
    // Additional debug logs for trimmed values
    console.log("TRIMMED VALUES CHECK (FINAL):");
    console.log(`- API ID: "${trimmedApiId}" (length: ${trimmedApiId.length})`);
    console.log(`- API Hash: "${trimmedApiHash.substring(0, 3)}..." (length: ${trimmedApiHash.length})`);
    console.log(`- Phone: "${trimmedPhoneNumber}" (length: ${trimmedPhoneNumber.length})`);
    
    // Route the request to the appropriate handler with more robust logging
    console.log(`🔄 Routing to operation handler: ${operation}`);
    try {
      const response = await routeOperation(
        operation,
        {
          apiId: trimmedApiId,
          apiHash: trimmedApiHash,
          phoneNumber: trimmedPhoneNumber,
          accountId: accountId || 'temp',
          sessionString: effectiveSessionString
        },
        {
          verificationCode,
          messageId,
          sourceChannel,
          targetChannel,
          sourceChannels,
          debug
        }
      );
      
      // Log success and execution time
      console.log(`✅ Operation '${operation}' completed successfully`);
      logExecutionComplete(startTime);
      return response;
    } catch (routeError) {
      console.error(`❌ Error in operation '${operation}':`, routeError);
      console.error("Stack trace:", routeError instanceof Error ? routeError.stack : "No stack available");
      return createErrorResponse(routeError, 500, updatedCorsHeaders);
    }
  } catch (error) {
    console.error("💥 Unhandled error in telegram-connector:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack available");
    return createErrorResponse(error, 500, updatedCorsHeaders);
  }
});
