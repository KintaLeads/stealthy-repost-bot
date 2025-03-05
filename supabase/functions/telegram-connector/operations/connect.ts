
// Handler for 'connect' operation
import { TelegramClientImplementation } from '../telegram-client.ts';

export async function handleConnect(client: TelegramClientImplementation, corsHeaders: Record<string, string>, data: any = {}) {
  // Connect to Telegram and return session string if successful
  try {
    console.log("Connect operation called with data:", {
      accountId: data.accountId,
      verificationCode: data.verificationCode ? "******" : undefined
    });
    
    // If a verification code is provided, try to verify it
    if (data.verificationCode) {
      console.log("Verification code provided, attempting to verify");
      const verifyResult = await client.verifyCode(data.verificationCode);
      
      if (!verifyResult.success) {
        console.error("Verification failed:", verifyResult.error);
        return new Response(
          JSON.stringify({ 
            error: verifyResult.error || 'Failed to verify code',
            success: false 
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log("Verification successful, getting session");
      
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
    console.log("No verification code provided, initiating connection");
    const connectResult = await client.connect();
    
    if (!connectResult.success) {
      console.error("Connection failed:", connectResult.error);
      return new Response(
        JSON.stringify({ 
          error: connectResult.error || 'Failed to connect to Telegram',
          success: false
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // If code is needed, return this information to the client
    if (connectResult.codeNeeded) {
      console.log("Code needed, returning phoneCodeHash");
      return new Response(
        JSON.stringify({
          success: true,
          codeNeeded: true,
          phoneCodeHash: connectResult.phoneCodeHash,
          message: 'Verification code sent to your phone',
          accountId: client.getAccountId()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Already authenticated, return session string
    console.log("Already authenticated, returning session string");
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
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
