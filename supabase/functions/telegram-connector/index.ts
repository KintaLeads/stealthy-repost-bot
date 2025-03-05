
// Main function handler for Telegram connector
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { TelegramClientImplementation } from './telegram-client.ts';
import { handleConnect } from './operations/connect.ts';
import { handleListen } from './operations/listen.ts';
import { handleRepost } from './operations/repost.ts';

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { apiId, apiHash, phoneNumber, sourceChannels, operation, messageId, sourceChannel, targetChannel } = await req.json();
    
    // Validate required parameters
    if (!apiId || !apiHash || !phoneNumber) {
      return new Response(
        JSON.stringify({ error: 'Missing required Telegram API credentials' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get session from headers if available
    const sessionString = req.headers.get('X-Telegram-Session') || '';

    // Initialize Telegram client with the real implementation
    const client = new TelegramClientImplementation(apiId, apiHash, phoneNumber, sessionString);

    // Check which operation is requested
    switch (operation) {
      case 'connect':
        return await handleConnect(client, corsHeaders);
        
      case 'listen':
        return await handleListen(client, sourceChannels, corsHeaders);
        
      case 'repost':
        return await handleRepost(client, messageId, sourceChannel, targetChannel, corsHeaders);
        
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid operation' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
