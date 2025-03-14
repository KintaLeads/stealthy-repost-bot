
// Handle connect operation
import { corsHeaders } from "../../_shared/cors.ts";
import { TelegramClientInterface } from "../client/types.ts";
import { createOperationErrorResponse, validateClientSetup } from "./auth/errorHandler.ts";
import { handleInitialConnection } from "./auth/initialConnection.ts";
import { handleCodeVerification } from "./auth/codeVerification.ts";
import { logOperationStart } from "../utils/logger.ts";

export async function handleConnect(
  client: TelegramClientInterface,
  headers: Record<string, string>,
  options: { 
    verificationCode?: string; 
    debug?: boolean;
    testMode?: boolean;
  } = {}
): Promise<Response> {
  logOperationStart("connect");
  
  // If this is just a test mode request, return success
  if (options.testMode === true) {
    console.log("🧪 Test mode detected, returning success response");
    return new Response(
      JSON.stringify({
        success: true,
        message: "Test connection successful",
        test: true
      }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
  
  console.log("🔄 Connect operation started with options:", {
    hasVerificationCode: !!options.verificationCode,
    debug: !!options.debug,
    sessionPresent: !!headers['X-Telegram-Session'],
    phoneNumber: client.phoneNumber ? client.phoneNumber.substring(0, 4) + "****" : "[MISSING]"
  });
  
  try {
    // Validate client setup
    if (!validateClientSetup(client, options.debug || false)) {
      console.error("❌ Invalid client setup", {
        hasApiId: !!client.apiId,
        hasApiHash: !!client.apiHash,
        hasPhoneNumber: !!client.phoneNumber
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid client setup",
          details: {
            apiId: client.apiId ? "present" : "missing",
            apiHash: client.apiHash ? "present" : "missing",
            phoneNumber: client.phoneNumber ? "present" : "missing"
          }
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400
        }
      );
    }
    
    // Check if we're verifying a code or establishing initial connection
    if (options.verificationCode) {
      console.log("🔑 Handling code verification...");
      const response = await handleCodeVerification(client, options.verificationCode, headers);
      
      // Log connection status based on response data
      try {
        const responseData = await response.clone().json();
        console.log("📡 Code verification connection status:", { 
          success: responseData.success,
          codeVerification: true,
          ...responseData
        });
        console.log("📡 Code verification response:", responseData);
      } catch (e) {
        console.error("Error parsing response for logging:", e);
      }
      
      return response;
    } else {
      console.log("🔄 Handling initial connection...");
      const response = await handleInitialConnection(client, headers);
      
      // Log connection status based on response data
      try {
        const responseData = await response.clone().json();
        console.log("📡 Initial connection status:", { 
          success: responseData.success,
          initialConnection: true,
          codeNeeded: responseData.codeNeeded,
          ...responseData
        });
        console.log("📡 Initial connection response:", responseData);
      } catch (e) {
        console.error("Error parsing response for logging:", e);
      }
      
      return response;
    }
  } catch (error) {
    console.error("❌ Error in connect operation:", error);
    return createOperationErrorResponse(error, "connect operation");
  }
}
