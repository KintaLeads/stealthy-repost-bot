// Handler for 'listen' operation
import { TelegramClientImplementation } from '../client/telegram-client.ts';

export async function handleListen(
  client: TelegramClientImplementation, 
  sourceChannels: string[], 
  corsHeaders: Record<string, string>
) {
  try {
    await client.connect();
    
    if (!sourceChannels || sourceChannels.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No source channels provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Start listening to the channels
    const results = [];
    for (const channelUsername of sourceChannels) {
      try {
        // Get the channel entity
        const channel = await client.getEntity(channelUsername);
        
        // Get recent messages
        const messages = await client.getMessages(channel, { limit: 10 });
        
        // Process messages for the response
        const processedMessages = messages.map(msg => ({
          id: msg.id,
          text: msg.message || '',
          date: msg.date,
          media: msg.media ? true : undefined, // Simplify media info for the response
          mediaAlbum: msg.groupedId ? true : undefined
        }));
        
        results.push({
          channel: channelUsername,
          success: true,
          messageCount: messages.length,
          sampleMessages: processedMessages
        });
      } catch (error) {
        console.error(`Error getting messages from ${channelUsername}:`, error);
        results.push({
          channel: channelUsername,
          success: false,
          error: error.message
        });
      }
    }
    
    // Get session string for future requests
    const sessionString = client.getSession();
    
    return new Response(
      JSON.stringify({ results, sessionString }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error in listen operation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
