
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { corsHeaders } from '../_shared/cors.ts';

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

    // Handle different operations
    if (operation === 'connect') {
      // Log the connection attempt for debugging
      console.log(`🔗 Realtime connection attempt`);
      console.log(`API ID: ${apiId || 'Not provided'}`);
      console.log(`API Hash: ${apiHash ? (apiHash.substring(0, 3) + '...') : 'Not provided'}`);
      console.log(`Phone: ${phoneNumber ? (phoneNumber.substring(0, 4) + '****') : 'Not provided'}`);
      
      // Validate required params for connection
      if (!apiId || !apiHash || !phoneNumber) {
        const missingParams = [];
        if (!apiId) missingParams.push('apiId');
        if (!apiHash) missingParams.push('apiHash');
        if (!phoneNumber) missingParams.push('phoneNumber');
        
        console.error(`Missing required parameters: ${missingParams.join(', ')}`);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Missing required parameters for connection',
            details: { missingParameters: missingParams }
          }),
          {
            status: 400,
            headers: updatedCorsHeaders
          }
        );
      }
      
      // Additional validation for API ID format
      const apiIdNum = Number(apiId);
      if (isNaN(apiIdNum) || apiIdNum <= 0) {
        console.error(`Invalid API ID format: ${apiId}`);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid API ID format',
            details: { 
              providedValue: apiId,
              expected: 'A positive number'
            }
          }),
          {
            status: 400,
            headers: updatedCorsHeaders
          }
        );
      }
      
      // Simulate successful authentication and return a session
      console.log("✅ Connection simulation successful");
      const mockSession = `session_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Realtime connection established',
          connectionId: `realtime_${Date.now()}`,
          sessionString: mockSession
        }),
        {
          status: 200,
          headers: {
            ...updatedCorsHeaders,
            'X-Telegram-Session': mockSession,
          }
        }
      )
    } 
    else if (operation === 'subscribe') {
      if (!Array.isArray(channelNames) || channelNames.length === 0) {
        console.error("No channels provided for subscription");
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'No channels provided for subscription',
            details: { tip: 'Provide an array of channel names to subscribe to' }
          }),
          {
            status: 400,
            headers: updatedCorsHeaders
          }
        )
      }
      
      console.log(`📊 Subscribing to channels: ${channelNames.join(', ')}`);
      
      // Generate some sample messages for testing
      const sampleMessages = channelNames.map(channel => ({
        channel,
        success: true,
        sampleMessages: [
          {
            id: Date.now(),
            text: `Sample message from ${channel}`,
            date: Math.floor(Date.now() / 1000)
          }
        ]
      }));
      
      return new Response(
        JSON.stringify({
          success: true,
          message: `Subscribed to ${channelNames.length} channels`,
          channels: channelNames,
          results: sampleMessages
        }),
        {
          status: 200,
          headers: updatedCorsHeaders
        }
      )
    }
    else if (operation === 'disconnect') {
      const connectionId = req.headers.get('X-Connection-Id')
      console.log(`🔌 Disconnecting realtime connection: ${connectionId || 'unknown'}`)
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Realtime connection closed'
        }),
        {
          status: 200,
          headers: updatedCorsHeaders
        }
      )
    }
    else {
      console.error(`Unknown operation: ${operation}`);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `Unknown operation: ${operation}`,
          details: { supportedOperations: ['connect', 'subscribe', 'disconnect'] }
        }),
        {
          status: 400,
          headers: updatedCorsHeaders
        }
      )
    }
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
