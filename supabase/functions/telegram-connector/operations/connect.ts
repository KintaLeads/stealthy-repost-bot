
// Connect to telegram and handle verification
import { corsHeaders } from "../../_shared/cors.ts";
import { TelegramClientImplementation } from "../client/telegram-client.ts";

export async function handleConnect(
  client: TelegramClientImplementation, 
  corsHeaders: Record<string, string>,
  options: { verificationCode?: string, debug?: boolean }
): Promise<Response> {
  const debug = options.debug || false;
  console.log(`Handling connect operation, verificationCode provided: ${!!options.verificationCode}, debug: ${debug}`);
  
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
              "X-Telegram-Session": session,
              "Access-Control-Expose-Headers": "X-Telegram-Session"
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
      
      // Add more debug logging if requested
      if (debug) {
        console.log("Debug mode enabled for connection");
        try {
          // Safely try to get phone number
          const phoneDisplay = client.getPhoneNumber ? 
            client.getPhoneNumber().substring(0, 4) + "****" : 
            "Not available";
            
          console.log("Client details:", {
            phoneNumber: phoneDisplay,
            hasSession: !!client.getSession(),
            authState: client.getAuthState()
          });
        } catch (err) {
          console.error("Error accessing client properties:", err);
        }
      }
      
      const connectResult = await client.connect();
      
      if (connectResult.success) {
        if (connectResult.codeNeeded) {
          console.log("Phone verification code needed");
          
          // In development mode, we might have a test code
          if (connectResult._testCode && debug) {
            console.log(`⚠️ DEVELOPMENT MODE: Verification code is ${connectResult._testCode}`);
          }
          
          console.log("Code sent successfully via MTProto, awaiting verification");
          
          return new Response(
            JSON.stringify({
              success: true,
              codeNeeded: true,
              codeRequested: true,
              phoneCodeHash: connectResult.phoneCodeHash,
              message: "Authentication code sent to phone",
              _testCode: debug ? connectResult._testCode : undefined // Only include in debug mode
            }),
            { headers: { 
                ...corsHeaders, 
                "Content-Type": "application/json",
                "Access-Control-Expose-Headers": "X-Telegram-Session" 
              } 
            }
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
                "X-Telegram-Session": session,
                "Access-Control-Expose-Headers": "X-Telegram-Session"
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
