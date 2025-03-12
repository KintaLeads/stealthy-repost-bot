
import { corsHeaders } from "../_shared/cors.ts";
import { createBadRequestResponse } from "./utils/errorHandler.ts";
import { handleConnect } from "./operations/connect.ts";
import { handleListen } from "./operations/listen.ts";
import { handleRepost } from "./operations/repost.ts";
import { handleValidate } from "./operations/validate.ts";
import { handleHealthcheck } from "./utils/healthcheck.ts";
import { createTelegramClient } from "./client/index.ts";
import { updatedCorsHeaders } from "./utils/requestHandler.ts";

// Router to handle different operations
export async function routeOperation(
  operation: string,
  clientParams: {
    apiId: string;
    apiHash: string;
    phoneNumber: string;
    accountId: string;
    sessionString: string;
  },
  requestParams: {
    verificationCode?: string;
    messageId?: number;
    sourceChannel?: string;
    targetChannel?: string;
    sourceChannels?: string[];
    debug?: boolean;
  } = {}
): Promise<Response> {
  console.log(`🔄 Processing ${operation} operation`);

  try {
    // Create the client with validated credentials
    console.log("🔄 Creating Telegram client with validated credentials");
    const client = createTelegramClient({
      apiId: clientParams.apiId,
      apiHash: clientParams.apiHash,
      phoneNumber: clientParams.phoneNumber,
      accountId: clientParams.accountId || 'temp',
      sessionString: clientParams.sessionString
    });

    // Route to the appropriate operation handler
    let response;
    switch (operation) {
      case 'validate':
        response = await handleValidate(client, updatedCorsHeaders);
        break;
        
      case 'connect':
        response = await handleConnect(client, updatedCorsHeaders, { 
          verificationCode: requestParams.verificationCode, 
          debug: requestParams.debug === true 
        });
        break;
        
      case 'listen':
        response = await handleListen(client, requestParams.sourceChannels || [], updatedCorsHeaders);
        break;
        
      case 'repost':
        response = await handleRepost(
          client, 
          requestParams.messageId || 0, 
          requestParams.sourceChannel || "", 
          requestParams.targetChannel || "", 
          updatedCorsHeaders
        );
        break;
        
      case 'healthcheck':
        response = handleHealthcheck(updatedCorsHeaders);
        break;
        
      default:
        console.error("⚠️ Invalid operation:", operation);
        return createBadRequestResponse(
          `Invalid operation: ${operation}. Supported operations are: validate, connect, listen, repost, healthcheck`,
          updatedCorsHeaders
        );
    }
    
    return response;
  } catch (clientError) {
    console.error("⚠️ Error initializing Telegram client:", clientError);
    return createBadRequestResponse(
      `Error initializing Telegram client: ${clientError instanceof Error ? clientError.message : String(clientError)}`,
      updatedCorsHeaders
    );
  }
}
