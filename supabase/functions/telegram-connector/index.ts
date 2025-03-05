
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
  // Log that the function was called with detailed info
  console.log("⭐⭐⭐ Telegram connector function called ⭐⭐⭐", {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
  });
  
  // Handle CORS
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request for CORS");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log("⭐ REQUEST BODY ⭐", {
      ...requestBody,
      apiHash: requestBody.apiHash ? "***********" : undefined, // Mask sensitive data
      verificationCode: requestBody.verificationCode ? "******" : undefined,
    });
    
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
      verificationCode 
    } = requestBody;
    
    // Validate required parameters
    if (!apiId || !apiHash || !phoneNumber || !accountId) {
      console.error("⚠️ Missing required parameters:", {
        hasApiId: !!apiId,
        hasApiHash: !!apiHash,
        hasPhoneNumber: !!phoneNumber,
        hasAccountId: !!accountId
      });
      return new Response(
        JSON.stringify({ 
          error: 'Missing required Telegram API credentials or account ID',
          success: false
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get session from headers if available
    const sessionString = req.headers.get('X-Telegram-Session') || '';
    console.log("Session provided:", sessionString ? "Yes (length: " + sessionString.length + ")" : "No");

    // Initialize Telegram client with the real implementation
    console.log("🔄 Initializing TelegramClientImplementation with accountId:", accountId);
    const client = new TelegramClientImplementation(apiId, apiHash, phoneNumber, accountId, sessionString);

    // Check which operation is requested
    console.log(`🔄 Processing ${operation} operation`);
    let response;
    switch (operation) {
      case 'connect':
        console.log("🔄 Handling connect operation, verificationCode provided:", !!verificationCode);
        response = await handleConnect(client, corsHeaders, { verificationCode });
        console.log("🔄 Connect operation response:", JSON.parse(await response.text()));
        return response;
        
      case 'listen':
        response = await handleListen(client, sourceChannels, corsHeaders);
        console.log("🔄 Listen operation response:", JSON.parse(await response.text()));
        return response;
        
      case 'repost':
        response = await handleRepost(client, messageId, sourceChannel, targetChannel, corsHeaders);
        console.log("🔄 Repost operation response:", JSON.parse(await response.text()));
        return response;
        
      default:
        console.error("⚠️ Invalid operation:", operation);
        return new Response(
          JSON.stringify({ 
            error: 'Invalid operation',
            success: false
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('⚠️ Error processing request:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
