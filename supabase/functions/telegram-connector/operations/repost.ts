// Handler for 'repost' operation
import { TelegramClientImplementation } from '../client/telegram-client.ts';

export async function handleRepost(
  client: TelegramClientImplementation,
  messageId: string,
  sourceChannel: string,
  targetChannel: string,
  corsHeaders: Record<string, string>
) {
  try {
    await client.connect();
    
    if (!messageId || !sourceChannel || !targetChannel) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters for repost operation' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get the source channel entity
    const sourceEntity = await client.getEntity(sourceChannel);
    
    // Get the specific message to repost
    const messages = await client.getMessages(sourceEntity, { ids: [parseInt(messageId, 10)] });
    
    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Message not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get the target channel entity
    const targetEntity = await client.getEntity(targetChannel);
    
    // Re-post the message
    const message = messages[0];
    let result;
    
    if (message.media) {
      // For messages with media, we need to forward them
      result = await client.sendMessage(targetEntity, { 
        message: message.message || '',
        // In a real implementation, you would handle media forwarding here
      });
    } else {
      // For text-only messages
      result = await client.sendMessage(targetEntity, { 
        message: message.message || '' 
      });
    }
    
    // Get session string for future requests
    const sessionString = client.getSession();
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.id,
        sessionString
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in repost operation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
