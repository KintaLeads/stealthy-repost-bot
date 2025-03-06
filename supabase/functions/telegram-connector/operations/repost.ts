
// Handler for 'repost' operation
import { TelegramClientImplementation } from '../client/telegram-client.ts';

export async function handleRepost(
  client: TelegramClientImplementation,
  messageId: number,
  sourceChannel: string,
  targetChannel: string,
  corsHeaders: Record<string, string>
) {
  try {
    console.log("Starting repost operation...");
    
    if (!messageId || !sourceChannel || !targetChannel) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Missing required parameters for repost operation' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Repost the message
    const repostResult = await client.repostMessage(messageId, sourceChannel, targetChannel);
    
    if (!repostResult.success) {
      console.error("Error reposting message:", repostResult.error);
      return new Response(
        JSON.stringify(repostResult),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Message ${messageId} reposted from ${sourceChannel} to ${targetChannel}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in repost operation:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "An unknown error occurred" 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
