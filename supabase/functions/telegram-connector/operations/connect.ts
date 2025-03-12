
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
    // Add detailed logging of client properties for troubleshooting
    if (debug) {
      console.log("DEBUG: Client properties check:");
      console.log(`- API ID: ${client.getApiId ? client.getApiId() : 'Not available'}`);
      console.log(`- API Hash: ${client.getApiHash ? client.getApiHash().substring(0, 3) + '...' : 'Not available'}`);
      console.log(`- Phone: ${client.getPhoneNumber ? client.getPhoneNumber() : 'Not available'}`);
      console.log(`- Session available: ${!!client.getSession()}`);
    }
    
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
            error: verificationResult.error || "Failed to verify code",
            details: {
              verificationAttempted: true,
              verificationResult
            }
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
      
      // Enhanced debug logging
      if (debug) {
        console.log("Debug mode enabled for connection");
        try {
          // Log credentials format
          const apiId = client.getApiId();
          const apiIdNumber = Number(apiId);
          console.log(`API ID check: "${apiId}" (${typeof apiId})`);
          console.log(`   - As number: ${apiIdNumber}, isNaN: ${isNaN(apiIdNumber)}`); 
          console.log(`API Hash check: ${client.getApiHash().substring(0, 3)}... (length: ${client.getApiHash().length})`);
          console.log(`Phone check: ${client.getPhoneNumber()}`);
          
          // Log client state
          console.log("Client auth state:", client.getAuthState());
          console.log("Session available:", !!client.getSession());
          
          // Force client preparation before connect
          console.log("Preparing client for connection...");
          await client.reinitialize?.();
        } catch (debugError) {
          console.error("Error during debug checks:", debugError);
          // Continue execution - this is just diagnostic
        }
      }
      
      console.log("Starting connection process...");
      try {
        // Add timeout to ensure any initialization completes
        await new Promise(resolve => setTimeout(resolve, 1000));
        
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
          // Enhanced error information for connection failures
          console.error("Connection failed:", connectResult.error);
          return new Response(
            JSON.stringify({
              success: false,
              error: connectResult.error || "Failed to connect to Telegram",
              details: connectResult.details || {
                errorSource: "client.connect",
                apiIdProvided: !!client.getApiId(),
                apiHashProvided: !!client.getApiHash(),
                phoneProvided: !!client.getPhoneNumber()
              }
            }),
            { 
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" } 
            }
          );
        }
      } catch (connectError) {
        console.error("Error during connect:", connectError);
        return new Response(
          JSON.stringify({
            success: false,
            error: connectError instanceof Error ? connectError.message : String(connectError),
            details: {
              errorSource: "clientConnectException",
              name: connectError instanceof Error ? connectError.name : "Unknown",
              stack: connectError instanceof Error ? connectError.stack : null
            }
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
    }
  } catch (error) {
    // Provide more detailed error information in the response
    console.error("Error in connect operation:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace");
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        details: {
          errorSource: "connectOperationException",
          name: error instanceof Error ? error.name : "Unknown",
          stack: error instanceof Error ? error.stack : null,
          context: "telegram-connector/operations/connect.ts"
        }
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
}
