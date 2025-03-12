
import { corsHeaders } from "../../../_shared/cors.ts";
import { TelegramClientInterface } from "../../client/types.ts";

/**
 * Creates a standardized error response for operation errors
 */
export function createOperationErrorResponse(
  error: unknown, 
  errorSource: string = "unknown"
): Response {
  console.error(`Error in ${errorSource}:`, error);
  console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace");
  
  return new Response(
    JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      details: {
        errorSource: errorSource,
        name: error instanceof Error ? error.name : "Unknown",
        stack: error instanceof Error ? error.stack : null,
        context: "telegram-connector/operations"
      }
    }),
    { 
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    }
  );
}

/**
 * Helper function to validate client setup
 */
export function validateClientSetup(
  client: TelegramClientInterface, 
  debug: boolean = false
): boolean {
  if (!client) {
    console.error("Client is null or undefined");
    return false;
  }
  
  if (debug) {
    try {
      console.log("DEBUG: Client state check:");
      console.log(`- API ID provided: ${!!client.getApiId()}`);
      console.log(`- API Hash provided: ${!!client.getApiHash()}`);
      console.log(`- Phone provided: ${!!client.getPhoneNumber()}`);
      console.log(`- Session available: ${!!client.getSession()}`);
      console.log(`- Auth state: ${client.getAuthState()}`);
    } catch (e) {
      console.error("Error checking client state:", e);
      return false;
    }
  }
  
  return true;
}
