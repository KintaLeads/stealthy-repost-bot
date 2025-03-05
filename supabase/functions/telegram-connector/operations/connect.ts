
// Handler for 'connect' operation
import { TelegramClientImplementation } from '../telegram-client.ts';

export async function handleConnect(client: TelegramClientImplementation, corsHeaders: Record<string, string>, data: any = {}) {
  // Connect to Telegram and return session string if successful
  try {
    // If a verification code is provided, try to verify it
    if (data.verificationCode) {
      console.log("Verification code provided, attempting to verify");
      const verifyResult = await client.verifyCode(data.verificationCode);
      
      if (!verifyResult.success) {
        return new Response(
          JSON.stringify({ error: verifyResult.error || 'Failed to verify code' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Code verification successful, get session for future requests
      const sessionString = client.getSession();
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Successfully authenticated with Telegram API',
          sessionString: sessionString,
          accountId: client.getAccountId()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // If no verification code is provided, initiate connection
    const { success, codeNeeded, phoneCodeHash } = await client.connect();
    
    if (!success) {
      return new Response(
        JSON.stringify({ error: 'Failed to connect to Telegram' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // If code is needed, return this information to the client
    if (codeNeeded) {
      return new Response(
        JSON.stringify({
          success: true,
          codeNeeded: true,
          phoneCodeHash: phoneCodeHash,
          message: 'Verification code sent to your phone',
          accountId: client.getAccountId()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Already authenticated, return session string
    const sessionString = client.getSession();
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Connected to Telegram API',
        sessionString: sessionString,
        accountId: client.getAccountId()
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
