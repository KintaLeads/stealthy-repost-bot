
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { corsHeaders } from '../_shared/cors.ts';
import { createTelegramClient } from "../telegram-connector/client/index.ts";

// Create Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient(supabaseUrl, supabaseKey)

// Add Access-Control-Expose-Headers to the CORS headers
const updatedCorsHeaders = {
  ...corsHeaders,
  'Access-Control-Expose-Headers': 'X-Connection-Id, X-Telegram-Session',
  'Content-Type': 'application/json'
};

Deno.serve(async (req) => {
  console.log("📡 Telegram Realtime Function Called:", new Date().toISOString());
  console.log("Request URL:", req.url);
  console.log("Request method:", req.method);
  
  // Handle CORS preflight requests with proper status code
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request (CORS preflight)");
    return new Response(null, { 
      headers: updatedCorsHeaders,
      status: 204
    });
  }

  try {
    const { method } = req
    
    // Only allow POST requests
    if (method !== 'POST') {
      console.error(`Method ${method} not allowed, expected POST`);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Method ${method} not allowed`,
          details: { allowedMethod: 'POST' }
        }),
        {
          status: 405,
          headers: updatedCorsHeaders
        }
      )
    }

    // Get the session from headers if available
    const sessionString = req.headers.get('X-Telegram-Session') || '';
    console.log("Session header present:", !!sessionString);
    
    // Get the request data
    const requestBody = await req.text();
    console.log("Raw request body:", requestBody);
    
    let requestData;
    try {
      requestData = JSON.parse(requestBody);
      console.log("Parsed request data:", JSON.stringify(requestData, null, 2));
    } catch (error) {
      console.error('Error parsing JSON request:', error);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid JSON in request body',
          details: { 
            errorType: 'ParseError',
            message: error.message,
            rawBody: requestBody.substring(0, 200) + (requestBody.length > 200 ? '...' : '')
          }
        }),
        {
          status: 400,
          headers: updatedCorsHeaders
        }
      );
    }
    
    if (!requestData) {
      console.error("Request data is null or undefined after parsing");
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid or empty request body',
          details: { tip: 'Ensure the request body is valid JSON and not empty' }
        }),
        {
          status: 400,
          headers: updatedCorsHeaders
        }
      );
    }
    
    const { operation, apiId, apiHash, phoneNumber, channelNames, sessionString: bodySessionString } = requestData;
    const effectiveSessionString = sessionString || bodySessionString || '';

    // Basic validation
    if (!operation) {
      console.error("Missing required parameter: operation");
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing required parameter: operation',
          details: { requiredParameters: ['operation'] }
        }),
        {
          status: 400,
          headers: updatedCorsHeaders
        }
      )
    }

    console.log(`🔄 Processing operation: ${operation}`);
    console.log(`Channel names:`, channelNames || 'None provided');
    console.log(`Session provided: ${effectiveSessionString ? 'Yes (length: ' + effectiveSessionString.length + ')' : 'No'}`);

    // Check authentication for operations that require it
    if (operation === 'subscribe' || operation === 'listen') {
      if (!effectiveSessionString) {
        console.error("Authentication required but no session provided");
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Not authenticated. Please authenticate first.',
            needsAuthentication: true,
            details: { tip: 'Connect to Telegram first to get an authentication session' }
          }),
          {
            status: 401,
            headers: updatedCorsHeaders
          }
        );
      }
    }

    // Initialize Telegram client if needed for operations
    if ((operation === 'connect' || operation === 'subscribe') && apiId && apiHash) {
      try {
        // Using the shared Telegram client creation logic
        const client = createTelegramClient({
          apiId: apiId,
          apiHash: apiHash,
          phoneNumber: phoneNumber || '',
          accountId: 'realtime_listener',
          sessionString: effectiveSessionString
        });
        
        console.log("Telegram client created successfully for realtime operations");
        
        // Process the rest of the operation with the client...
        // (would continue with real implementation)
      } catch (error) {
        console.error("Failed to create Telegram client:", error);
        return new Response(
          JSON.stringify({
            success: false,
            error: `Failed to create Telegram client: ${error instanceof Error ? error.message : String(error)}`,
            details: { errorSource: 'clientCreation' }
          }),
          {
            status: 500,
            headers: updatedCorsHeaders
          }
        );
      }
    }

    // For now, return a response indicating that real-time functionality is being implemented
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Realtime functionality is being implemented with actual Telegram API calls',
        operation: operation,
        mock: false,
        implementation: 'in_progress'
      }),
      {
        status: 200,
        headers: updatedCorsHeaders
      }
    );
  } catch (error) {
    console.error('Error in telegram-realtime function:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Enhanced error response with detailed information
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack?.split('\n').map(line => line.trim())
        } : { raw: String(error) }
      }),
      {
        status: 500,
        headers: updatedCorsHeaders
      }
    )
  }
})
