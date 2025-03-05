
// Validate telegram credentials
import { corsHeaders } from "../../_shared/cors.ts";
import { TelegramClientImplementation } from "../client/telegram-client.ts";

export async function handleValidate(
  client: TelegramClientImplementation,
  corsHeaders: Record<string, string>
): Promise<Response> {
  console.log("Handling validate operation");
  
  try {
    const result = await client.validateCredentials();
    
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
