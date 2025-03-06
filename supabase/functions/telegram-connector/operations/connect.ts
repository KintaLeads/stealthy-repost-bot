
// Connect to telegram and handle verification
import { corsHeaders } from "../../_shared/cors.ts";
import { TelegramClientImplementation } from "../client/telegram-client.ts";

export async function handleConnect(
  client: TelegramClientImplementation, 
  corsHeaders: Record<string, string>,
  options: { verificationCode?: string }
): Promise<Response> {
  console.log(`Handling connect operation, verificationCode provided: ${!!options.verificationCode}`);
  
  try {
    // If verification code is provided, verify it
    if (options.verificationCode) {
      console.log("Verifying code");
      const verificationResult = await client.verifyCode(options.verificationCode);
      
      if (verificationResult.success) {
        console.log("Code verification successful");
        const session = client.getSession();
        
        return new Response(
          JSON.stringify({
            success: true,
            message: "Authentication completed successfully",
            session: session,
            authState: client.getAuthState()
          }),
          { 
            headers: { 
              ...corsHeaders, 
              "Content-Type": "application/json",
              "X-Telegram-Session": session
            } 
          }
        );
      } else {
        console.error("Code verification failed:", verificationResult.error);
        return new Response(
          JSON.stringify({
            success: false,
            error: verificationResult.error || "Failed to verify code"
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
    } 
    // If no verification code is provided, attempt to connect
    else {
      console.log("Connecting to Telegram");
      const connectResult = await client.connect();
      
      if (connectResult.success) {
        if (connectResult.codeNeeded) {
          console.log("Phone verification code needed");
          return new Response(
            JSON.stringify({
              success: true,
              codeRequested: true,
              phoneCodeHash: connectResult.phoneCodeHash,
              message: "Authentication code sent to phone"
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          console.log("Already authenticated");
          const session = client.getSession();
          
          return new Response(
            JSON.stringify({
              success: true,
              message: "Already authenticated",
              session: session,
              authState: client.getAuthState()
            }),
            { 
              headers: { 
                ...corsHeaders, 
                "Content-Type": "application/json",
                "X-Telegram-Session": session
              } 
            }
          );
        }
      } else {
        console.error("Connection failed:", connectResult.error);
        return new Response(
          JSON.stringify({
            success: false,
            error: connectResult.error || "Failed to connect to Telegram"
          }),
          { 
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
    }
  } catch (error) {
    console.error("Error in connect operation:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
}
