
// Validate telegram credentials
import { corsHeaders } from "../../_shared/cors.ts";
import { TelegramClientImplementation } from "../client/telegram-client.ts";

export async function handleValidate(
  client: TelegramClientImplementation,
  corsHeaders: Record<string, string>
): Promise<Response> {
  console.log("Handling validate operation");
  
  try {
    // Validate required parameters before proceeding
    if (!client.apiId || !client.apiHash || !client.phoneNumber) {
      const missingParams = {
        hasApiId: !!client.apiId,
        hasApiHash: !!client.apiHash,
        hasPhoneNumber: !!client.phoneNumber,
      };
      
      console.error("⚠️ Missing required parameters:", missingParams);
      
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing required parameters. Please provide API ID, API Hash, and Phone Number."
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    console.log("Calling validateCredentials method...");
    const result = await client.validateCredentials();
    console.log("Validation result:", result);
    
    if (result.success) {
      console.log("Validation successful");
      return new Response(
        JSON.stringify({
          success: true,
          message: "Telegram API credentials validated successfully"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      console.error("Validation failed:", result.error);
      return new Response(
        JSON.stringify({
          success: false,
          error: result.error || "Failed to validate Telegram API credentials"
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
  } catch (error) {
    console.error("Error in validate operation:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
}
