
import { corsHeaders } from "../_shared/cors.ts";
import { createBadRequestResponse } from "./utils/errorHandler.ts";
import { handleConnect } from "./operations/connect.ts";
import { handleListen } from "./operations/listen.ts";
import { handleRepost } from "./operations/repost.ts";
import { handleValidate } from "./operations/validate.ts";
import { handleHealthcheck } from "./utils/healthcheck.ts";
import { createTelegramClient } from "./client/index.ts";
import { updatedCorsHeaders } from "./utils/requestHandler.ts";

// Define the client parameters interface for better type safety
interface ClientParams {
  apiId: string | number;
  apiHash: string;
  phoneNumber: string;
  accountId: string;
}

// Updated CORS headers for all responses
const enhancedCorsHeaders = {
  ...updatedCorsHeaders,
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
  'Surrogate-Control': 'no-store'
};

// Router to handle different operations
export async function routeOperation(
  operation: string,
  clientParams: ClientParams,
  requestData: any
): Promise<Response> {
  console.log(`🔄 Processing ${operation} operation`, {
    hasApiId: !!clientParams.apiId,
    apiIdType: typeof clientParams.apiId,
    hasApiHash: !!clientParams.apiHash,
    hasPhoneNumber: !!clientParams.phoneNumber
  });

  try {
    // Check if healthcheck is being requested (special case that doesn't need client)
    if (operation === 'healthcheck') {
      return handleHealthcheck(enhancedCorsHeaders);
    }
    
    // Handle test mode separately
    if (operation === 'connect' && requestData.testMode === true) {
      console.log("🧪 Test mode request detected");
      return new Response(
        JSON.stringify({
          success: true,
          message: "Test connection successful",
          test: true
        }), 
        { headers: { ...enhancedCorsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Validate client parameters before creating client
    if (!clientParams.apiId) {
      console.error("⚠️ Missing apiId in client parameters");
      return createBadRequestResponse("Missing required parameter: apiId", enhancedCorsHeaders);
    }
    
    if (!clientParams.apiHash) {
      console.error("⚠️ Missing apiHash in client parameters");
      return createBadRequestResponse("Missing required parameter: apiHash", enhancedCorsHeaders);
    }
    
    if (!clientParams.phoneNumber) {
      console.error("⚠️ Missing phoneNumber in client parameters");
      return createBadRequestResponse("Missing required parameter: phoneNumber", enhancedCorsHeaders);
    }

    // Ensure apiId is always a number - convert if it's a string
    const numericApiId = typeof clientParams.apiId === 'number'
      ? clientParams.apiId
      : parseInt(String(clientParams.apiId), 10);
      
    if (isNaN(numericApiId) || numericApiId <= 0) {
      console.error("⚠️ Invalid apiId (not a valid number):", clientParams.apiId);
      return createBadRequestResponse(
        `Invalid apiId: ${clientParams.apiId} is not a valid positive number`,
        enhancedCorsHeaders
      );
    }
    
    // Log the validated parameters
    console.log("✅ Validated client parameters:", {
      apiId: numericApiId,
      apiIdType: typeof numericApiId,
      apiHashLength: clientParams.apiHash?.length,
      phoneNumber: clientParams.phoneNumber.substring(0, 4) + "****",
      accountId: clientParams.accountId
    });

    // Create the client with validated credentials
    console.log("🔄 Creating Telegram client with validated credentials");
    let client;
    try {
      client = createTelegramClient({
        ...clientParams,
        apiId: numericApiId // Always pass as a number
      });
      
      console.log("✅ Telegram client created successfully");
    } catch (clientError) {
      console.error("⚠️ Error initializing Telegram client:", clientError);
      return createBadRequestResponse(
        `Error initializing Telegram client: ${clientError instanceof Error ? clientError.message : String(clientError)}`,
        enhancedCorsHeaders
      );
    }

    // Route to the appropriate operation handler
    let response;
    console.log(`🔄 Routing to handler for operation: ${operation}`);
    
    switch (operation) {
      case 'validate':
        response = await handleValidate(client, enhancedCorsHeaders);
        break;
        
      case 'connect':
        response = await handleConnect(client, enhancedCorsHeaders, { 
          verificationCode: requestData.verificationCode, 
          debug: requestData.debug === true 
        });
        break;
        
      case 'listen':
        response = await handleListen(client, requestData.sourceChannels || [], enhancedCorsHeaders);
        break;
        
      case 'repost':
        response = await handleRepost(
          client, 
          requestData.messageId || 0, 
          requestData.sourceChannel || "", 
          requestData.targetChannel || "", 
          enhancedCorsHeaders
        );
        break;
        
      default:
        console.error("⚠️ Invalid operation:", operation);
        return createBadRequestResponse(
          `Invalid operation: ${operation}. Supported operations are: validate, connect, listen, repost, healthcheck`,
          enhancedCorsHeaders
        );
    }
    
    console.log(`✅ Operation ${operation} completed successfully`);
    
    // Ensure we have a valid response with CORS headers
    if (response instanceof Response) {
      // Clone the response to add our enhanced CORS headers
      const originalHeaders = Object.fromEntries(response.headers.entries());
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: { ...originalHeaders, ...enhancedCorsHeaders }
      });
    }
    
    return response;
  } catch (error) {
    console.error("⚠️ Error in routeOperation:", error);
    return createBadRequestResponse(
      `Error processing operation: ${error instanceof Error ? error.message : String(error)}`,
      enhancedCorsHeaders
    );
  }
}
