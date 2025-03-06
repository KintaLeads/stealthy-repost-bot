
import { corsHeaders } from "../../_shared/cors.ts";
import { TelegramClientImplementation } from "../client/telegram-client.ts";

export const handleValidate = async (client: TelegramClientImplementation, corsHeaders: Record<string, string>) => {
  try {
    console.log("Starting validation process...");
    
    // Try to validate credentials
    const validationResult = await client.validateCredentials();
    
    if (!validationResult.success) {
      console.error("Validation failed:", validationResult.error);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: validationResult.error || "Failed to validate Telegram credentials" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("Validation successful");
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Telegram API credentials are valid"
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error validating credentials:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "An error occurred during validation"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};
