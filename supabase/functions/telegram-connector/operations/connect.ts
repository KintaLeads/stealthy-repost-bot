
// Handle connect operation
import { corsHeaders } from "../../_shared/cors.ts";
import { TelegramClientInterface } from "../client/types.ts";
import { createOperationErrorResponse, validateClientSetup } from "./auth/errorHandler.ts";
import { handleInitialConnection } from "./auth/initialConnection.ts";
import { handleCodeVerification } from "./auth/codeVerification.ts";
import { logOperationStart, logConnectionStatus } from "../utils/logger.ts";

export async function handleConnect(
  client: TelegramClientInterface,
  headers: Record<string, string>,
  options: { 
    verificationCode?: string; 
    debug?: boolean;
  } = {}
): Promise<Response> {
  logOperationStart("connect");
  console.log("Connect operation options:", {
    hasVerificationCode: !!options.verificationCode,
    debug: !!options.debug
  });
  
  try {
    // Validate client setup
    if (!validateClientSetup(client, options.debug || false)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid client setup"
        }),
        { 
          headers: { ...headers, "Content-Type": "application/json" },
          status: 400
        }
      );
    }
    
    // Check if we're verifying a code or establishing initial connection
    if (options.verificationCode) {
      console.log("Handling code verification...");
      const response = await handleCodeVerification(client, options.verificationCode, headers);
      
      // Log connection status based on response data
      try {
        const responseData = await response.clone().json();
        logConnectionStatus(responseData.success, {
          codeVerification: true,
          ...responseData
        });
      } catch (e) {
        console.error("Error parsing response for logging:", e);
      }
      
      return response;
    } else {
      console.log("Handling initial connection...");
      const response = await handleInitialConnection(client, headers);
      
      // Log connection status based on response data
      try {
        const responseData = await response.clone().json();
        logConnectionStatus(responseData.success, {
          initialConnection: true,
          codeNeeded: responseData.codeNeeded,
          ...responseData
        });
      } catch (e) {
        console.error("Error parsing response for logging:", e);
      }
      
      return response;
    }
  } catch (error) {
    return createOperationErrorResponse(error, "connect operation");
  }
}
