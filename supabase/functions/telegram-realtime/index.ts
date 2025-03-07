
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
        JSON.stringify({ error: `Method ${method} not allowed` }),
        {
          status: 405,
          headers: updatedCorsHeaders
        }
      )
    }

    // Get the session from headers if available
    const sessionString = req.headers.get('X-Telegram-Session') || '';
    
    // Get the request data
    const { operation, apiId, apiHash, phoneNumber, channelNames, sessionString: bodySessionString } = await req.json()
    const effectiveSessionString = sessionString || bodySessionString || '';

    // Basic validation
    if (!operation || !apiId || !apiHash || !phoneNumber) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
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
            needsAuthentication: true
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
          JSON.stringify({ error: 'No channels provided for subscription' }),
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
        JSON.stringify({ error: `Unknown operation: ${operation}` }),
        {
          status: 400,
          headers: updatedCorsHeaders
        }
      )
    }
  } catch (error) {
    console.error('Error in telegram-realtime function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        success: false
      }),
      {
        status: 500,
        headers: updatedCorsHeaders
      }
    )
  }
})
