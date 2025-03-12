
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { corsHeaders } from '../_shared/cors.ts';

// Create Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient(supabaseUrl, supabaseKey)

// Add Access-Control-Expose-Headers to the CORS headers
const updatedCorsHeaders = {
  ...corsHeaders,
  'Access-Control-Expose-Headers': 'X-Connection-Id, X-Telegram-Session'
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests with proper status code
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: updatedCorsHeaders,
      status: 204
    });
  }

  try {
    const { method } = req
    
    // Only allow POST requests
    if (method !== 'POST') {
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
    
    // Get the request data
    const requestData = await req.json().catch(error => {
      console.error('Error parsing JSON request:', error);
      return null;
    });
    
    if (!requestData) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid JSON in request body',
          details: { tip: 'Ensure the request body is valid JSON' }
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

    console.log(`Received realtime operation: ${operation} for channels:`, channelNames);
    console.log(`Session provided: ${effectiveSessionString ? 'Yes (length: ' + effectiveSessionString.length + ')' : 'No'}`);

    // Check authentication for operations that require it
    if (operation === 'subscribe' || operation === 'listen') {
      if (!effectiveSessionString) {
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

    // Simulate real-time connection (this would be replaced with actual Telegram API integration)
    if (operation === 'connect') {
      // Log the connection attempt for debugging
      console.log(`Realtime connection attempt for phone: ${phoneNumber.substring(0, 4)}****`);
      
      // Validate required params for connection
      if (!apiId || !apiHash || !phoneNumber) {
        const missingParams = [];
        if (!apiId) missingParams.push('apiId');
        if (!apiHash) missingParams.push('apiHash');
        if (!phoneNumber) missingParams.push('phoneNumber');
        
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
      
      // Simulate successful authentication and return a session
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
            'X-Telegram-Session': mockSession
          }
        }
      )
    } 
    else if (operation === 'subscribe') {
      if (!Array.isArray(channelNames) || channelNames.length === 0) {
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
      
      console.log(`Subscribing to channels: ${channelNames.join(', ')}`);
      
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
      console.log(`Disconnecting realtime connection: ${connectionId}`)
      
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
    console.error('Error in telegram-realtime function:', error)
    
    // Enhanced error response with detailed information
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : { raw: String(error) }
      }),
      {
        status: 500,
        headers: updatedCorsHeaders
      }
    )
  }
})
