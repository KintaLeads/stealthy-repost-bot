
// Handler for 'validate' operation - to validate credentials without establishing a full connection
import { TelegramClientImplementation } from '../telegram-client.ts';

export async function handleValidate(client: TelegramClientImplementation, corsHeaders: Record<string, string>) {
  try {
    console.log("⭐ Validate operation called - testing API credentials ⭐");
    
    // Try to establish a basic connection to validate credentials
    // We don't need a full connection, just enough to verify the API credentials work
    console.log("Calling client.validateCredentials()...");
    const result = await client.validateCredentials();
    
    console.log("Validation result:", result);
    
    if (!result.success) {
      console.error("⚠️ Validation failed:", result.error);
      return new Response(
        JSON.stringify({ 
          error: result.error,
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
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
