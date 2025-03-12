
// Handler for 'listen' operation
import { TelegramClientInterface } from '../client/types.ts';

export async function handleListen(
  client: TelegramClientInterface, 
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
    
    // Check authentication first
    const isAuthenticated = await client.isAuthenticated();
    if (!isAuthenticated) {
      console.error("Error: Not authenticated. Please authenticate first.");
      
      // Get the current session to include in the response for debugging
      const currentSession = client.getSession();
      const sessionInfo = currentSession ? 
        `Session provided (length: ${currentSession.length}) but invalid or expired` : 
        'No session provided';
      
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Not authenticated. Please authenticate first.',
          needsAuthentication: true,
          details: sessionInfo
        }),
        { 
          status: 401, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Access-Control-Expose-Headers': 'X-Telegram-Session'
          } 
        }
      );
    }
    
    // Start listening to the channels
    const listenResult = await client.listenToChannels(sourceChannels);
    
    if (!listenResult.success) {
      console.error("Error listening to channels:", listenResult.error);
      
      // Check if it's an authentication error
      if (listenResult.error && listenResult.error.includes('authentication')) {
        return new Response(
          JSON.stringify({
            success: false,
            error: listenResult.error,
            needsAuthentication: true
          }),
          { 
            status: 401, 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json',
              'Access-Control-Expose-Headers': 'X-Telegram-Session'
            } 
          }
        );
      }
      
      return new Response(
        JSON.stringify(listenResult),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Include the session in the response for the client to store
    const session = client.getSession();
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Now listening to ${sourceChannels.length} channels`,
        sessionString: session,
        // Sample data for testing
        results: sourceChannels.map(channel => ({
          channel,
          success: true,
          sampleMessages: [
            {
              id: Date.now(),
              text: `Sample message from ${channel}`,
              date: Math.floor(Date.now() / 1000)
            }
          ]
        }))
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'X-Telegram-Session': session,
          'Access-Control-Expose-Headers': 'X-Telegram-Session' 
        } 
      }
    );
  } catch (error) {
    console.error("Error in listen operation:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "An unknown error occurred" 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Access-Control-Expose-Headers': 'X-Telegram-Session'
        } 
      }
    );
  }
}
