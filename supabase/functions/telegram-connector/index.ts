
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

// Initial startup log
console.log("🚀 Telegram connector function starting", new Date().toISOString());

Deno.serve(async (req) => {
  // Log every incoming request immediately
  console.log(`📥 Incoming request to telegram-connector: ${req.method} ${req.url}`, new Date().toISOString());
  
  // Measure function execution time
  const startTime = Date.now();
  
  // Enhanced CORS handling with better debug information
  if (req.method === 'OPTIONS') {
    console.log("📡 Handling CORS OPTIONS request");
    return handleCorsRequest();
  }

  try {
    // Print request details
    console.log("📋 Request headers:", Object.fromEntries(req.headers.entries()));
    
    // Make a full copy of the request for processing to avoid consuming the body
    const requestCopy = req.clone();
    
    // Perform basic request validation
    if (req.method !== 'POST') {
      console.error(`❌ Invalid HTTP method: ${req.method}. Only POST is supported.`);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Method not allowed. Use POST for operations.',
        }),
        {
          status: 405,
          headers: updatedCorsHeaders
        }
      );
    }
    
    // Parse and validate the request body
    const { valid, data, error } = await parseRequestBody(requestCopy);
    
    // If parsing failed, return an error
    if (!valid) {
      console.error("❌ Invalid request body:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error || 'Failed to parse request body',
          receivedHeaders: Object.fromEntries(req.headers.entries()),
          troubleshooting: [
            "Ensure Content-Type header is set to application/json",
            "Make sure request body is explicitly stringified using JSON.stringify",
            "Verify no middleware is removing or altering the request body"
          ]
        }),
        {
          status: 400,
          headers: updatedCorsHeaders
        }
      );
    }
    
    // Debug mode response for testing connections
    if (data.debug === true && data.testMode === true) {
      console.log("✅ Debug mode test request, returning success");
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Debug test connection successful',
          receivedData: {
            operation: data.operation,
            apiIdPresent: !!data.apiId,
            apiHashPresent: !!data.apiHash,
            phoneNumberPresent: !!data.phoneNumber
          }
        }),
        {
          status: 200,
          headers: updatedCorsHeaders
        }
      );
    }
    
    // Validate that required fields are present
    if (!data || !data.operation) {
      console.error("❌ Missing 'operation' field in request");
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required field',
          details: "The 'operation' field is required"
        }),
        {
          status: 400,
          headers: updatedCorsHeaders
        }
      );
    }

    // Log operation being attempted
    console.log(`🎯 Attempting operation: ${data.operation}`);
    
    // Log API credential details
    if (data.apiId !== undefined) {
      debugCheckValue('apiId', data.apiId);
    }
    
    if (data.apiHash !== undefined) {
      console.log('apiHash exists:', {
        type: typeof data.apiHash,
        length: data.apiHash?.length,
        isEmpty: data.apiHash === '',
        isUndefined: data.apiHash === undefined,
        isNull: data.apiHash === null,
        snippet: data.apiHash?.substring(0, 5) + '...'
      });
    }
    
    if (data.phoneNumber !== undefined) {
      console.log('phoneNumber exists:', {
        type: typeof data.phoneNumber,
        length: data.phoneNumber?.length,
        isEmpty: data.phoneNumber === '',
        isUndefined: data.phoneNumber === undefined,
        isNull: data.phoneNumber === null,
        snippet: data.phoneNumber?.substring(0, 4) + '****'
      });
    }
    
    // Route the request to the appropriate handler
    const response = await routeOperation(
      data.operation,
      {
        apiId: data.apiId,
        apiHash: data.apiHash || '',
        phoneNumber: data.phoneNumber || '',
        accountId: data.accountId || 'temp',
        sessionString: data.sessionString || ''
      },
      data
    );
    
    // Log completion
    const duration = Date.now() - startTime;
    console.log(`✅ Operation completed: ${data.operation}`, {
      duration,
      status: response.status
    });
    
    return response;
    
  } catch (error) {
    console.error("💥 Unhandled error in telegram-connector:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack available");
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }),
      { 
        status: 500,
        headers: updatedCorsHeaders
      }
    );
  }
});
