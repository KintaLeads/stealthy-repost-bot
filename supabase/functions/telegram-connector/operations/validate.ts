
// Handler for 'validate' operation - to validate credentials without establishing a full connection
import { TelegramClientImplementation } from '../client/telegram-client.ts';

export async function handleValidate(client: TelegramClientImplementation, corsHeaders: Record<string, string>) {
  try {
    console.log("⭐ Validate operation called - testing API credentials ⭐");
    console.log("Client configuration:", {
      apiId: "MASKED",
      apiHash: "MASKED", 
      phoneNumber: "MASKED",
      accountId: client.getAccountId()
    });
    
    // Get information about the environment
    try {
      console.log("Edge Function environment information:");
      console.log(`Deno version: ${Deno.version.deno}`);
      console.log(`V8 version: ${Deno.version.v8}`);
      console.log(`TypeScript version: ${Deno.version.typescript}`);
      
      // Try importing the Telegram client to check if it's available
      const { version } = await import('npm:telegram');
      console.log("Telegram client library version:", version);
    } catch (envError) {
      console.error("Error getting environment information:", envError);
    }
    
    // Try to establish a basic connection to validate credentials
    // We don't need a full connection, just enough to verify the API credentials work
    console.log("Calling client.validateCredentials()...");
    const result = await client.validateCredentials();
    
    console.log("Validation result:", result);
    
    if (!result.success) {
      console.error("⚠️ Validation failed:", result.error);
      return new Response(
        JSON.stringify({ 
          error: result.error || "Invalid Telegram API credentials",
          details: result.details || "The provided API ID, API Hash, or phone number is incorrect",
          success: false 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Telegram API credentials validated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("⚠️ Unexpected error in validate operation:", error);
    
    // Determine if this is a network error
    const isNetworkError = error instanceof Error && 
      (error.message.includes('network') || 
       error.message.includes('fetch') || 
       error.message.includes('connection'));
    
    const errorResponse = {
      error: error instanceof Error ? error.message : "Unknown error occurred",
      type: isNetworkError ? "network_error" : "validation_error",
      stack: error instanceof Error ? error.stack : undefined,
      success: false
    };
    
    console.error("Sending error response:", errorResponse);
    
    return new Response(
      JSON.stringify(errorResponse),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
