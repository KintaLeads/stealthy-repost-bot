
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { corsHeaders } from '../_shared/cors.ts';

// Create Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient(supabaseUrl, supabaseKey)

Deno.serve(async (req) => {
  // Handle CORS preflight requests with proper status code
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
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
          headers: corsHeaders
        }
      )
    }

    // Get the request data
    const { operation, apiId, apiHash, phoneNumber, channelNames } = await req.json()

    // Basic validation
    if (!operation || !apiId || !apiHash || !phoneNumber) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        {
          status: 400,
          headers: corsHeaders
        }
      )
    }

    console.log(`Received realtime operation: ${operation} for channels:`, channelNames)

    // Simulate real-time connection (this would be replaced with actual Telegram API integration)
    if (operation === 'connect') {
      // Log the connection attempt for debugging
      console.log(`Realtime connection attempt for phone: ${phoneNumber.substring(0, 4)}****`)
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Realtime connection established',
          connectionId: `realtime_${Date.now()}`
        }),
        {
          status: 200,
          headers: corsHeaders
        }
      )
    } 
    else if (operation === 'subscribe') {
      if (!Array.isArray(channelNames) || channelNames.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No channels provided for subscription' }),
          {
            status: 400,
            headers: corsHeaders
          }
        )
      }
      
      console.log(`Subscribing to channels: ${channelNames.join(', ')}`)
      
      return new Response(
        JSON.stringify({
          success: true,
          message: `Subscribed to ${channelNames.length} channels`,
          channels: channelNames
        }),
        {
          status: 200,
          headers: corsHeaders
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
          headers: corsHeaders
        }
      )
    }
    else {
      return new Response(
        JSON.stringify({ error: `Unknown operation: ${operation}` }),
        {
          status: 400,
          headers: corsHeaders
        }
      )
    }
  } catch (error) {
    console.error('Error in telegram-realtime function:', error)
    
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      {
        status: 500,
        headers: corsHeaders
      }
    )
  }
})
