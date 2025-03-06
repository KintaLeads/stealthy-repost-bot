
// Handler for 'listen' operation
import { TelegramClientImplementation } from '../client/telegram-client.ts';

export async function handleListen(
  client: TelegramClientImplementation, 
  sourceChannels: string[], 
  corsHeaders: Record<string, string>
) {
  try {
    console.log("Starting listen operation...");
    
    if (!sourceChannels || sourceChannels.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'No source channels provided' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Start listening to the channels
    const listenResult = await client.listenToChannels(sourceChannels);
    
    if (!listenResult.success) {
      console.error("Error listening to channels:", listenResult.error);
      return new Response(
        JSON.stringify(listenResult),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Now listening to ${sourceChannels.length} channels`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in listen operation:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "An unknown error occurred" 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
