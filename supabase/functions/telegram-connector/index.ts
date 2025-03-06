
// Main function handler for Telegram connector
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { TelegramClientImplementation } from './client/telegram-client.ts';
import { handleConnect } from './operations/connect.ts';
import { handleListen } from './operations/listen.ts';
import { handleRepost } from './operations/repost.ts';
import { handleValidate } from './operations/validate.ts';

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// This list contains all the allowed versions of the Telegram client library - ONLY use 2.26.22
const SUPPORTED_TELEGRAM_VERSIONS = ['2.26.22']; // Only 2.26.22 is supported

Deno.serve(async (req) => {
  // Measure function execution time
  const startTime = Date.now();
  
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
    // Print Deno and environment information for debugging
    console.log("Environment information:");
    console.log(`Deno version: ${Deno.version.deno}`);
    console.log(`V8 version: ${Deno.version.v8}`);
    console.log(`TypeScript version: ${Deno.version.typescript}`);
    
    // Log if we have the required Supabase environment variables
    console.log("Supabase configuration:", {
      hasUrl: !!supabaseUrl, 
      hasKey: !!supabaseKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseKey?.length || 0
    });
    
    // Parse the request body
    let requestBody;
    try {
      const text = await req.text();
      console.log("Raw request body:", text);
      
      // Handle empty body case
      if (!text.trim()) {
        return new Response(
          JSON.stringify({ 
            error: 'Empty request body',
            success: false
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      requestBody = JSON.parse(text);
      console.log("⭐ PARSED REQUEST BODY ⭐", {
        ...requestBody,
        apiHash: requestBody.apiHash ? "***********" : undefined, // Mask sensitive data
        verificationCode: requestBody.verificationCode ? "******" : undefined,
      });
    } catch (parseError) {
      console.error("⚠️ Failed to parse request body:", parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request format: Could not parse JSON body',
          success: false
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      verificationCode 
    } = requestBody;
    
    // Handle healthcheck operation - special case
    if (operation === 'healthcheck') {
      console.log("✅ Processing healthcheck operation");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Telegram connector is running", 
          version: "2.26.22"
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Enhanced validation - check for missing, empty, or undefined parameters
    const isApiIdValid = apiId !== undefined && apiId !== '';
    const isApiHashValid = apiHash !== undefined && apiHash !== '';
    const isPhoneNumberValid = phoneNumber !== undefined && phoneNumber !== '';
    
    // Validate required parameters based on operation type
    if (operation === 'validate' || operation === 'connect') {
      if (!isApiIdValid || !isApiHashValid || !isPhoneNumberValid) {
        console.error("⚠️ Missing required parameters:", {
          hasApiId: isApiIdValid,
          hasApiHash: isApiHashValid,
          hasPhoneNumber: isPhoneNumberValid
        });
        return new Response(
          JSON.stringify({ 
            error: 'Missing required Telegram API credentials. Please ensure apiId, apiHash, and phoneNumber are provided.',
            success: false
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get session from headers if available
    const sessionString = req.headers.get('X-Telegram-Session') || '';
    console.log("Session provided:", sessionString ? "Yes (length: " + sessionString.length + ")" : "No");

    // Initialize Telegram client with the real implementation
    console.log("🔄 Initializing TelegramClientImplementation with accountId:", accountId);
    console.log("🔄 API ID format valid:", !isNaN(Number(apiId)));
    console.log("🔄 API Hash format reasonable:", apiHash?.length === 32);
    console.log("🔄 Phone number format:", phoneNumber ? "Provided" : "Not provided");
    
    try {
      // Try importing the Telegram client to check if it's available and use the specified version
      // IMPORTANT: Make sure to use EXACTLY version 2.26.22
      const { version } = await import('npm:telegram@2.26.22');
      console.log("✅ Successfully imported Telegram client library version:", version);
      
      // Check if the version is supported (must be exactly 2.26.22)
      if (!SUPPORTED_TELEGRAM_VERSIONS.includes(version)) {
        console.error(`⚠️ Using unsupported Telegram client version: ${version}. Only version 2.26.22 is supported.`);
        return new Response(
          JSON.stringify({ 
            error: `Unsupported Telegram client version: ${version}. Only version 2.26.22 is supported.`,
            success: false
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (importError) {
      console.error("❌ Failed to import Telegram client library:", importError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to load Telegram client library. The Edge Function might be missing dependencies.',
          success: false
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const client = new TelegramClientImplementation(apiId, apiHash, phoneNumber, accountId || 'temp', sessionString);

    // Check which operation is requested
    if (!operation) {
      console.error("⚠️ No operation specified");
      return new Response(
        JSON.stringify({ 
          error: 'No operation specified. Please provide an operation parameter.',
          success: false
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`🔄 Processing ${operation} operation`);
    let response;
    switch (operation) {
      case 'validate':
        console.log("🔄 Handling validate operation");
        response = await handleValidate(client, corsHeaders);
        console.log("🔄 Validate operation response status:", response.status);
        console.log("🔄 Validate operation response:", await response.clone().text());
        break;
        
      case 'connect':
        console.log("🔄 Handling connect operation, verificationCode provided:", !!verificationCode);
        response = await handleConnect(client, corsHeaders, { verificationCode });
        console.log("🔄 Connect operation response status:", response.status);
        console.log("🔄 Connect operation response:", await response.clone().text());
        break;
        
      case 'listen':
        response = await handleListen(client, sourceChannels, corsHeaders);
        console.log("🔄 Listen operation response status:", response.status);
        console.log("🔄 Listen operation response:", await response.clone().text());
        break;
        
      case 'repost':
        response = await handleRepost(client, messageId, sourceChannel, targetChannel, corsHeaders);
        console.log("🔄 Repost operation response status:", response.status);
        console.log("🔄 Repost operation response:", await response.clone().text());
        break;
        
      case 'healthcheck':
        // This is a failsafe - we already handled healthcheck above
        response = new Response(
          JSON.stringify({ 
            success: true, 
            message: "Telegram connector is running", 
            version: "2.26.22"
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
        break;
        
      default:
        console.error("⚠️ Invalid operation:", operation);
        return new Response(
          JSON.stringify({ 
            error: `Invalid operation: ${operation}. Supported operations are: validate, connect, listen, repost, healthcheck`,
            success: false
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
    
    // Calculate and log execution time
    const executionTime = Date.now() - startTime;
    console.log(`✅ Function execution completed in ${executionTime}ms`);
    
    return response;
  } catch (error) {
    console.error('⚠️ Error processing request:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        detailed: error.stack,
        success: false
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
