
// Handler for 'connect' operation
import { TelegramClientImplementation } from '../telegram-client.ts';

export async function handleConnect(client: TelegramClientImplementation, corsHeaders: Record<string, string>) {
  // Connect to Telegram and return session string if successful
  try {
    const connected = await client.connect();
    
    if (!connected) {
      return new Response(
        JSON.stringify({ error: 'Failed to connect to Telegram' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get session string for future requests
    const sessionString = client.getSession();
    
    // Return success
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Connected to Telegram API',
        sessionString: sessionString
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in connect operation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
