
// Main function handler for Telegram connector
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { TelegramClientImplementation } from './client/telegram-client.ts';
import { handleConnect } from './operations/connect.ts';
import { handleListen } from './operations/listen.ts';
import { handleRepost } from './operations/repost.ts';
import { handleValidate } from './operations/validate.ts';
import { handleHealthcheck } from './utils/healthcheck.ts';
import { createErrorResponse, createBadRequestResponse, validateRequiredParams } from './utils/errorHandler.ts';
import { logEnvironmentInfo, logSupabaseConfig, logRequestInfo, logRequestBody, logExecutionComplete } from './utils/logger.ts';

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Updated corsHeaders with both standard and content-type
const updatedCorsHeaders = {
  ...corsHeaders,
  'Access-Control-Expose-Headers': 'X-Telegram-Session'
};

// Debug function to check if a string value is valid
function debugCheckValue(name: string, value: any): void {
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
}

Deno.serve(async (req) => {
  // Measure function execution time
  const startTime = Date.now();
  
  // Log that the function was called with detailed info
  logRequestInfo(req);
  
  // Handle CORS preflight requests - updated to return proper CORS headers
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request for CORS with proper headers");
    return new Response(null, {
      headers: updatedCorsHeaders,
      status: 204
    });
  }

  try {
    // Print Deno and environment information for debugging
    logEnvironmentInfo();
    
    // Log if we have the required Supabase environment variables
    logSupabaseConfig(supabaseUrl, supabaseKey);
    
    // Parse the request body
    let requestBody;
    try {
      const text = await req.text();
      console.log("Raw request body:", text);
      
      // Handle empty body case
      if (!text.trim()) {
        return createBadRequestResponse('Empty request body', updatedCorsHeaders);
      }
      
      requestBody = JSON.parse(text);
      logRequestBody(requestBody);
    } catch (parseError) {
      console.error("⚠️ Failed to parse request body:", parseError);
      return createBadRequestResponse('Invalid request format: Could not parse JSON body', updatedCorsHeaders);
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
    
    // Enhanced debugging for ALL requests
    console.log("📝 DETAILED REQUEST INFO (DEBUG MODE)");
    console.log(`Operation: ${operation}`);
    
    // Debug check for all critical parameters
    debugCheckValue("apiId", apiId);
    debugCheckValue("apiHash", apiHash); 
    debugCheckValue("phoneNumber", phoneNumber);
    debugCheckValue("accountId", accountId);
    debugCheckValue("sessionString", sessionString);
    
    // Handle healthcheck operation
    if (operation === 'healthcheck') {
      return handleHealthcheck(updatedCorsHeaders);
    }
    
    // Validate required parameters based on operation type
    if (operation === 'validate' || operation === 'connect') {
      const { isValid, missingParams } = validateRequiredParams(apiId, apiHash, phoneNumber);
      
      if (!isValid) {
        console.error("⚠️ Missing required parameters:", missingParams);
        return createBadRequestResponse(
          `Missing required Telegram API credentials: ${missingParams.join(', ')}. Please ensure apiId, apiHash, and phoneNumber are provided.`,
          updatedCorsHeaders
        );
      }
      
      // Additional validation for apiId and apiHash
      if (apiId === 'undefined' || apiId === 'null' || apiId === '') {
        console.error("⚠️ API ID is empty or invalid:", apiId);
        return createBadRequestResponse(
          `Invalid API ID. Please ensure a valid apiId is provided.`,
          updatedCorsHeaders
        );
      }
      
      if (apiHash === 'undefined' || apiHash === 'null' || apiHash === '') {
        console.error("⚠️ API Hash is empty or invalid");
        return createBadRequestResponse(
          `Invalid API Hash. Please ensure a valid apiHash is provided.`,
          updatedCorsHeaders
        );
      }
      
      // Verify API ID is numeric
      const apiIdNum = Number(apiId);
      if (isNaN(apiIdNum) || apiIdNum <= 0) {
        console.error("⚠️ API ID is not a valid positive number:", apiId);
        return createBadRequestResponse(
          `Invalid API ID format. Expected a positive number, got: ${apiId}`,
          updatedCorsHeaders
        );
      }
      
      // Verify API Hash has reasonable length (Telegram hashes are typically 32 chars)
      if (apiHash.length < 5) {
        console.error("⚠️ API Hash is suspiciously short:", apiHash.length, "characters");
        return createBadRequestResponse(
          `Invalid API Hash format. Hash appears to be too short: ${apiHash.length} characters`,
          updatedCorsHeaders
        );
      }
    }

    // Get session from headers if available or from request body
    const headerSessionString = req.headers.get('X-Telegram-Session') || '';
    const effectiveSessionString = headerSessionString || sessionString || '';
    
    console.log("Session provided:", effectiveSessionString ? "Yes (length: " + effectiveSessionString.length + ")" : "No");
    
    // Initialize Telegram client
    console.log("🔄 Initializing TelegramClientImplementation with accountId:", accountId);
    console.log("🔄 API ID format valid:", !isNaN(Number(apiId)), apiId);
    console.log("🔄 API Hash format reasonable:", apiHash?.length >= 5, apiHash ? `${apiHash.substring(0, 3)}...` : 'missing');
    console.log("🔄 Phone number format:", phoneNumber ? "Provided" : "Not provided");
    
    try {
      // Create client with explicitly trimmed values
      const trimmedApiId = String(apiId).trim();
      const trimmedApiHash = String(apiHash).trim();
      const trimmedPhoneNumber = phoneNumber ? String(phoneNumber).trim() : '';
      
      // Additional debug logs for trimmed values
      console.log("TRIMMED VALUES CHECK:");
      console.log(`- API ID: "${trimmedApiId}" (length: ${trimmedApiId.length})`);
      console.log(`- API Hash: "${trimmedApiHash.substring(0, 3)}..." (length: ${trimmedApiHash.length})`);
      console.log(`- Phone: "${trimmedPhoneNumber}" (length: ${trimmedPhoneNumber.length})`);
      
      // Create the client with validated credentials
      const client = new TelegramClientImplementation(
        trimmedApiId, 
        trimmedApiHash, 
        trimmedPhoneNumber, 
        accountId || 'temp', 
        effectiveSessionString
      );

      // Check which operation is requested
      if (!operation) {
        console.error("⚠️ No operation specified");
        return createBadRequestResponse('No operation specified. Please provide an operation parameter.', updatedCorsHeaders);
      }
      
      // Route to the appropriate operation handler
      console.log(`🔄 Processing ${operation} operation`);
      let response;
      switch (operation) {
        case 'validate':
          response = await handleValidate(client, updatedCorsHeaders);
          break;
          
        case 'connect':
          response = await handleConnect(client, updatedCorsHeaders, { verificationCode, debug: debug === true });
          break;
          
        case 'listen':
          response = await handleListen(client, sourceChannels, updatedCorsHeaders);
          break;
          
        case 'repost':
          response = await handleRepost(client, messageId, sourceChannel, targetChannel, updatedCorsHeaders);
          break;
          
        case 'healthcheck':
          response = handleHealthcheck(updatedCorsHeaders);
          break;
          
        default:
          console.error("⚠️ Invalid operation:", operation);
          return createBadRequestResponse(
            `Invalid operation: ${operation}. Supported operations are: validate, connect, listen, repost, healthcheck`,
            updatedCorsHeaders
          );
      }
      
      // Log execution time and return response
      logExecutionComplete(startTime);
      return response;
    } catch (clientError) {
      console.error("⚠️ Error initializing Telegram client:", clientError);
      return createBadRequestResponse(
        `Error initializing Telegram client: ${clientError instanceof Error ? clientError.message : String(clientError)}`,
        updatedCorsHeaders
      );
    }
    
  } catch (error) {
    return createErrorResponse(error, 500, updatedCorsHeaders);
  }
});
