
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
    
    // Safely clone and read the request body
    let requestText;
    try {
      // Clone the request before reading it
      const clonedReq = req.clone();
      requestText = await clonedReq.text();
      console.log("📄 Raw request body:", requestText);
      
      // Check if the body is empty
      if (!requestText || requestText.trim() === '') {
        console.error("❌ Empty request body received");
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Empty request body',
            details: 'The request body is empty. Please provide a valid JSON body.'
          }),
          {
            status: 400,
            headers: updatedCorsHeaders
          }
        );
      }
    } catch (readError) {
      console.error("❌ Error reading request body:", readError);
      return new Response(
        JSON.stringify({
          success: false, 
          error: 'Failed to read request body',
          details: String(readError)
        }),
        { 
          status: 400,
          headers: updatedCorsHeaders
        }
      );
    }
    
    // Parse the JSON body
    let requestBody;
    try {
      requestBody = JSON.parse(requestText);
      console.log("🔍 Parsed request body:", {
        ...requestBody,
        apiHash: requestBody.apiHash ? '[REDACTED]' : undefined,
        sessionString: requestBody.sessionString ? `[${requestBody.sessionString.length} chars]` : undefined
      });
    } catch (parseError) {
      console.error("❌ JSON parse error:", parseError);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid JSON in request body',
          details: String(parseError),
          receivedBody: requestText.substring(0, 100) + (requestText.length > 100 ? '...' : '')
        }),
        {
          status: 400,
          headers: updatedCorsHeaders
        }
      );
    }
    
    // Validate the request has required fields
    if (!requestBody || !requestBody.operation) {
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
    console.log(`🎯 Attempting operation: ${requestBody.operation}`);
    
    // Route the request
    const response = await routeOperation(
      requestBody.operation,
      {
        apiId: requestBody.apiId,
        apiHash: requestBody.apiHash,
        phoneNumber: requestBody.phoneNumber,
        accountId: requestBody.accountId || 'temp',
        sessionString: requestBody.sessionString || ''
      },
      requestBody
    );
    
    // Log completion
    const duration = Date.now() - startTime;
    console.log(`✅ Operation completed: ${requestBody.operation}`, {
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
