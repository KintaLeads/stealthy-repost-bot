
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { corsHeaders } from '../_shared/cors.ts';
import { createTelegramClient } from "../telegram-connector/client/index.ts";
import { Message } from '../_shared/types.ts';

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

// Create a map to store active listeners
const activeListeners = new Map();

// Function to create a unique listener ID
const createListenerId = (accountId: string) => `listener_${accountId}_${Date.now()}`;

// Function to check if a session string is valid
const isValidSession = (sessionString: string) => {
  return sessionString && sessionString.length > 10;
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
    
    const { 
      operation, 
      apiId, 
      apiHash, 
      phoneNumber, 
      accountId,
      channelNames, 
      sessionString: bodySessionString 
    } = requestData;
    
    const effectiveSessionString = sessionString || bodySessionString || '';
    const clientId = accountId || 'unknown_account';

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
    
    // ADD HEALTHCHECK OPERATION
    if (operation === 'healthcheck') {
      console.log("🏥 Handling healthcheck request");
      
      const healthResponse = {
        status: "ok",
        timestamp: Date.now(),
        message: "Telegram realtime service is running",
        serviceInfo: {
          name: "telegram-realtime",
          version: "1.0.0",
          environment: Deno.env.get("ENVIRONMENT") || "development"
        },
        denoInfo: {
          version: Deno.version.deno,
          v8: Deno.version.v8,
          typescript: Deno.version.typescript
        }
      };
      
      console.log("Healthcheck response:", healthResponse);
      
      return new Response(
        JSON.stringify(healthResponse),
        { 
          headers: updatedCorsHeaders,
          status: 200
        }
      );
    }
    
    console.log(`Channel names:`, channelNames || 'None provided');
    console.log(`Session provided: ${effectiveSessionString ? 'Yes (length: ' + effectiveSessionString.length + ')' : 'No'}`);

    // Handle the different operations
    switch (operation) {
      case 'connect': {
        // Validate required parameters
        if (!apiId || !apiHash || !phoneNumber) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Missing required parameters for connect operation',
              details: {
                required: ['apiId', 'apiHash', 'phoneNumber'],
                provided: {
                  apiId: !!apiId,
                  apiHash: !!apiHash,
                  phoneNumber: !!phoneNumber
                }
              }
            }),
            {
              status: 400,
              headers: updatedCorsHeaders
            }
          );
        }

        // Initialize the client
        try {
          console.log("Creating Telegram client for connection check");
          const client = createTelegramClient({
            apiId,
            apiHash,
            phoneNumber,
            accountId: clientId,
            sessionString: effectiveSessionString
          });

          // Check if we're authenticated
          const isAuthenticated = await client.isAuthenticated();
          
          if (isAuthenticated) {
            console.log("Client is already authenticated");
            const session = client.getSession();
            
            return new Response(
              JSON.stringify({
                success: true,
                authenticated: true,
                message: 'Already authenticated to Telegram',
                sessionString: session
              }),
              {
                status: 200,
                headers: {
                  ...updatedCorsHeaders,
                  'X-Telegram-Session': session
                }
              }
            );
          } else {
            console.log("Client is not authenticated, needs to connect first");
            
            return new Response(
              JSON.stringify({
                success: false,
                authenticated: false,
                error: 'Not authenticated. Please authenticate using the telegram-connector function first.',
                needsAuthentication: true
              }),
              {
                status: 401,
                headers: updatedCorsHeaders
              }
            );
          }
        } catch (error) {
          console.error("Error creating or checking Telegram client:", error);
          
          return new Response(
            JSON.stringify({
              success: false,
              error: `Failed to create or check Telegram client: ${error instanceof Error ? error.message : String(error)}`
            }),
            {
              status: 500,
              headers: updatedCorsHeaders
            }
          );
        }
      }

      case 'listen': {
        // Check authentication
        if (!isValidSession(effectiveSessionString)) {
          console.error("Invalid or missing session for listen operation");
          
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Not authenticated. Please connect to Telegram first.',
              needsAuthentication: true
            }),
            {
              status: 401,
              headers: updatedCorsHeaders
            }
          );
        }

        // Validate required parameters
        if (!channelNames || !Array.isArray(channelNames) || channelNames.length === 0) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Missing or invalid channel names for listen operation',
              details: {
                required: 'Array of channel names',
                provided: channelNames ? typeof channelNames : 'undefined'
              }
            }),
            {
              status: 400,
              headers: updatedCorsHeaders
            }
          );
        }

        // Initialize the client
        try {
          console.log(`Setting up listener for account: ${clientId}`);
          
          // Check if we already have an active listener for this account
          if (activeListeners.has(clientId)) {
            console.log(`Stopping existing listener for account: ${clientId}`);
            const existingListener = activeListeners.get(clientId);
            
            if (existingListener.stopListener) {
              await existingListener.stopListener();
            }
            
            activeListeners.delete(clientId);
          }
          
          // Create new client with the session
          const client = createTelegramClient({
            apiId,
            apiHash,
            phoneNumber,
            accountId: clientId,
            sessionString: effectiveSessionString
          });
          
          // Start listening to channels
          const listenResult = await client.listenToChannels(channelNames);
          
          if (!listenResult.success) {
            console.error("Failed to listen to channels:", listenResult.error);
            
            return new Response(
              JSON.stringify({
                success: false,
                error: listenResult.error || 'Failed to listen to channels'
              }),
              {
                status: 400,
                headers: updatedCorsHeaders
              }
            );
          }
          
          // Create a unique listener ID
          const listenerId = createListenerId(clientId);
          
          // Store the listener with its stop function
          activeListeners.set(clientId, {
            id: listenerId,
            client,
            channels: channelNames,
            startedAt: new Date(),
            stopListener: () => {
              return client.disconnect();
            }
          });
          
          console.log(`Listener ${listenerId} created for account ${clientId}`);
          
          // Return success response
          return new Response(
            JSON.stringify({
              success: true,
              message: `Now listening to ${channelNames.length} channels`,
              listenerId,
              sessionString: client.getSession(),
              channels: channelNames
            }),
            {
              status: 200,
              headers: {
                ...updatedCorsHeaders,
                'X-Connection-Id': listenerId,
                'X-Telegram-Session': client.getSession()
              }
            }
          );
        } catch (error) {
          console.error("Error setting up listener:", error);
          
          return new Response(
            JSON.stringify({
              success: false,
              error: `Failed to set up listener: ${error instanceof Error ? error.message : String(error)}`
            }),
            {
              status: 500,
              headers: updatedCorsHeaders
            }
          );
        }
      }

      case 'disconnect': {
        try {
          // Check if we have an active listener for this account
          if (accountId && activeListeners.has(accountId)) {
            console.log(`Stopping listener for account: ${accountId}`);
            
            const listener = activeListeners.get(accountId);
            
            if (listener.stopListener) {
              await listener.stopListener();
            }
            
            activeListeners.delete(accountId);
            
            return new Response(
              JSON.stringify({
                success: true,
                message: `Disconnected from Telegram for account: ${accountId}`
              }),
              {
                status: 200,
                headers: updatedCorsHeaders
              }
            );
          } else {
            console.log(`No active listener found for account: ${accountId}`);
            
            return new Response(
              JSON.stringify({
                success: true,
                message: 'No active listener to disconnect'
              }),
              {
                status: 200,
                headers: updatedCorsHeaders
              }
            );
          }
        } catch (error) {
          console.error("Error disconnecting listener:", error);
          
          return new Response(
            JSON.stringify({
              success: false,
              error: `Failed to disconnect: ${error instanceof Error ? error.message : String(error)}`
            }),
            {
              status: 500,
              headers: updatedCorsHeaders
            }
          );
        }
      }

      case 'status': {
        try {
          // Check if we have an active listener for this account
          if (accountId && activeListeners.has(accountId)) {
            const listener = activeListeners.get(accountId);
            
            return new Response(
              JSON.stringify({
                success: true,
                connected: true,
                listenerId: listener.id,
                startedAt: listener.startedAt,
                channels: listener.channels
              }),
              {
                status: 200,
                headers: updatedCorsHeaders
              }
            );
          } else {
            return new Response(
              JSON.stringify({
                success: true,
                connected: false,
                message: 'No active listener found'
              }),
              {
                status: 200,
                headers: updatedCorsHeaders
              }
            );
          }
        } catch (error) {
          console.error("Error checking listener status:", error);
          
          return new Response(
            JSON.stringify({
              success: false,
              error: `Failed to check status: ${error instanceof Error ? error.message : String(error)}`
            }),
            {
              status: 500,
              headers: updatedCorsHeaders
            }
          );
        }
      }

      default:
        return new Response(
          JSON.stringify({
            success: false,
            error: `Unknown operation: ${operation}`,
            details: {
              supportedOperations: ['connect', 'listen', 'disconnect', 'status']
            }
          }),
          {
            status: 400,
            headers: updatedCorsHeaders
          }
        );
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
