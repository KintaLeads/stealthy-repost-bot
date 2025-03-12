
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
          
          // Log the client's internal state for additional debugging
          console.log("Client internal state check:");
          console.log(`Phone number set: ${!!client.getPhoneNumber()}`);
          console.log(`Auth state: ${client.getAuthState()}`);
          console.log(`Session available: ${!!client.getSession()}`);
          
          // NEW: Explicitly verify the apiId and apiHash credentials
          console.log("CREDENTIALS VERIFICATION:");
          const apiId = client.getApiId?.() || "NOT_AVAILABLE";
          const apiHashPrefix = client.getApiHash?.() ? 
            client.getApiHash().substring(0, 3) + "..." : 
            "NOT_AVAILABLE";
          
          console.log(`API ID: "${apiId}" (${typeof apiId})`);
          console.log(`API Hash: "${apiHashPrefix}" (length: ${client.getApiHash?.()?.length || 0})`);
          
          if (!apiId || apiId === "NOT_AVAILABLE") {
            console.error("⚠️ API ID IS MISSING OR UNAVAILABLE IN CLIENT!");
          }
          
          if (!apiHashPrefix || apiHashPrefix === "NOT_AVAILABLE") {
            console.error("⚠️ API HASH IS MISSING OR UNAVAILABLE IN CLIENT!");
          }
        } catch (err) {
          console.error("Error accessing client properties:", err);
        }
      }
      
      // NEW: Add a small delay to ensure proper initialization
      console.log("Pausing for 1000ms to ensure proper initialization...");
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // NEW: Force client re-initialization before connect
      try {
        console.log("Forcing client re-initialization...");
        await client.reinitialize?.();
        console.log("Client re-initialization completed");
      } catch (reinitError) {
        console.error("Error during client re-initialization:", reinitError);
        // Continue anyway as this is just an additional safety measure
      }
      
      console.log("Starting connection process...");
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
