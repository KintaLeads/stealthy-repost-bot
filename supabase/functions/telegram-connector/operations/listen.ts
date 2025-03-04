
// Handler for 'listen' operation
import { TelegramClientMock } from '../telegram-client.ts';

export async function handleListen(
  client: TelegramClientMock, 
  sourceChannels: string[], 
  corsHeaders: Record<string, string>
) {
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
      
      // Get recent messages as a test
      const messages = await client.getMessages(channel, { limit: 5 });
      
      results.push({
        channel: channelUsername,
        success: true,
        messageCount: messages.length,
        sampleMessages: messages.map(m => ({ 
          id: m.id, 
          text: m.message,
          date: m.date
        }))
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
  
  return new Response(
    JSON.stringify({ results, sessionString: client.getSession() }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
