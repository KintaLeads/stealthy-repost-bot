
// Handler for 'repost' operation
import { TelegramClientMock } from '../telegram-client.ts';

export async function handleRepost(
  client: TelegramClientMock,
  messageId: string,
  sourceChannel: string,
  targetChannel: string,
  corsHeaders: Record<string, string>
) {
  if (!messageId || !sourceChannel || !targetChannel) {
    return new Response(
      JSON.stringify({ error: 'Missing required parameters for reposting' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  await client.connect();
  
  try {
    // Get source channel entity
    const sourceEntity = await client.getEntity(sourceChannel);
    
    // Get the message
    const messages = await client.getMessages(sourceEntity, { ids: [messageId] });
    if (messages.length === 0) {
      throw new Error('Message not found');
    }
    
    const message = messages[0];
    
    // Get target channel entity
    const targetEntity = await client.getEntity(targetChannel);
    
    // Send message to target channel
    await client.sendMessage(targetEntity, { message: message.message });
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Message reposted successfully',
        sessionString: client.getSession()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error reposting message:', error);
    return new Response(
      JSON.stringify({ error: `Failed to repost message: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
