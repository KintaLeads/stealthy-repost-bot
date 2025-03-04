
// Handler for 'connect' operation
import { TelegramClientMock } from '../telegram-client.ts';

export async function handleConnect(client: TelegramClientMock, corsHeaders: Record<string, string>) {
  // Connect to Telegram and return verification code requirement if needed
  await client.connect();
  
  if (!client.isConnected()) {
    return new Response(
      JSON.stringify({ error: 'Failed to connect to Telegram' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Return success
  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Connected to Telegram API',
      sessionString: client.getSession()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
