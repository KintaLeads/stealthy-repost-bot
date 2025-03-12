
import { corsHeaders } from "../../../_shared/cors.ts";
import { TelegramClientInterface } from "../../client/types.ts";

/**
 * Handles the initial connection to Telegram
 */
export async function handleInitialConnection(
  client: TelegramClientInterface,
  headers: Record<string, string>
): Promise<Response> {
  console.log("Starting connection process...");
  
  try {
    // Add timeout to ensure any initialization completes
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const connectResult = await client.connect();
    
    if (!connectResult.success) {
      // Handle connection failure
      return buildConnectionErrorResponse(
        connectResult.error || "Failed to connect to Telegram", 
        connectResult.details
      );
    }
    
    // Check if code is needed
    if (connectResult.codeNeeded) {
      return buildCodeRequestedResponse(
        connectResult.phoneCodeHash || "", 
        connectResult._testCode
      );
    }
    
    // If we have a session, connection was successful
    if (connectResult.session) {
      return buildAuthenticatedResponse(
        connectResult.session,
        client.getAuthState() || "unknown",
        connectResult.user
      );
    }
    
    // Fallback for unexpected result
    return buildConnectionErrorResponse(
      "Unexpected connection result", 
      connectResult
    );
  } catch (connectError) {
    console.error("Error during connect:", connectError);
    return buildConnectionErrorResponse(
      connectError instanceof Error ? connectError.message : String(connectError),
      {
        errorSource: "clientConnectException",
        name: connectError instanceof Error ? connectError.name : "Unknown",
        stack: connectError instanceof Error ? connectError.stack : null
      }
    );
  }
}

/**
 * Builds a response for code requested scenario
 */
export function buildCodeRequestedResponse(
  phoneCodeHash: string, 
  testCode?: string, 
  debug: boolean = false
): Response {
  return new Response(
    JSON.stringify({
      success: true,
      codeNeeded: true,
      codeRequested: true,
      phoneCodeHash: phoneCodeHash,
      message: "Authentication code sent to phone",
      _testCode: debug ? testCode : undefined
    }),
    { headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json",
        "Access-Control-Expose-Headers": "X-Telegram-Session" 
      } 
    }
  );
}

/**
 * Builds a response for already authenticated scenario
 */
export function buildAuthenticatedResponse(
  session: string, 
  authState: string,
  user: any
): Response {
  return new Response(
    JSON.stringify({
      success: true,
      message: "Already authenticated",
      session: session,
      authState: authState,
      user: user
    }),
    { 
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json",
        "X-Telegram-Session": session,
        "Access-Control-Expose-Headers": "X-Telegram-Session"
      } 
    }
  );
}

/**
 * Builds an error response for connection failures
 */
export function buildConnectionErrorResponse(
  error: string, 
  details?: any
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: error || "Failed to connect to Telegram",
      details: details
    }),
    { 
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    }
  );
}
