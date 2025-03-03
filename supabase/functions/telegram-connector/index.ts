
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { TelegramClient } from 'https://esm.sh/telegram@2.15.5';
import { StringSession } from 'https://esm.sh/telegram/sessions@2.15.5';
import { corsHeaders } from '../_shared/cors.ts';
import { Api } from 'https://esm.sh/telegram@2.15.5';

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { apiId, apiHash, phoneNumber, sourceChannels, targetChannels, operation } = await req.json();
    
    // Validate required parameters
    if (!apiId || !apiHash || !phoneNumber) {
      return new Response(
        JSON.stringify({ error: 'Missing required Telegram API credentials' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Telegram client
    const stringSession = new StringSession(''); // Empty for now, we'll save this later
    const client = new TelegramClient(stringSession, parseInt(apiId), apiHash, {
      connectionRetries: 5,
    });

    // Different operations
    switch (operation) {
      case 'connect':
        // Connect to Telegram and return verification code requirement if needed
        await client.connect();
        
        if (!client.connected) {
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
            sessionString: client.session.save()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
        
      case 'listen':
        // Restore previous session if provided
        const session = req.headers.get('X-Telegram-Session');
        if (session) {
          client.session = new StringSession(session);
        }
        
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
          JSON.stringify({ results, sessionString: client.session.save() }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
        
      case 'repost':
        // Repost a specific message
        const { messageId, sourceChannel, targetChannel } = await req.json();
        
        if (!messageId || !sourceChannel || !targetChannel) {
          return new Response(
            JSON.stringify({ error: 'Missing required parameters for reposting' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        // Restore session if provided
        const repostSession = req.headers.get('X-Telegram-Session');
        if (repostSession) {
          client.session = new StringSession(repostSession);
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
              sessionString: client.session.save()
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
        
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid operation' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
