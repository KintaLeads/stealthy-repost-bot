
import { TelegramClient } from "https://esm.sh/telegram@2.19.10";
import { StringSession } from "https://esm.sh/telegram@2.19.10/sessions/index.js";
import { routeOperation } from "./router.ts";
import { handleCorsRequest, parseRequestBody, validateApiParameters } from "./utils/requestHandler.ts";

// Maximum time in milliseconds for function execution
const MAX_EXECUTION_TIME = 28000; // 28 seconds to allow for 2s buffer before Supabase's 30s timeout

export async function handler(req: Request) {
  // Set up a timeout to ensure we don't hit Supabase's 30s timeout without a response
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error("Function execution timed out")), MAX_EXECUTION_TIME)
  );
  
  // Wrap the actual handler in a promise so we can race with the timeout
  const handlerPromise = handleRequest(req);
  
  try {
    // Race the handler against the timeout
    return await Promise.race([handlerPromise, timeoutPromise]);
  } catch (timeoutError) {
    console.error("⚠️ Function execution timed out:", timeoutError);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Request timed out after " + (MAX_EXECUTION_TIME/1000) + " seconds",
        timeoutError: true
      }),
      { 
        status: 504, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' 
        } 
      }
    );
  }
}

async function handleRequest(req: Request) {
  try {
    // Check for CORS pre-flight requests first
    if (req.method === 'OPTIONS') {
      console.log("Handling CORS preflight request");
      return handleCorsRequest();
    }
    
    // Parse and validate the request body
    const { valid, data, error } = await parseRequestBody(req);
    
    if (!valid || !data) {
      console.error("Invalid request body:", error);
      return new Response(
        JSON.stringify({ success: false, error: error || "Invalid request format" }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' 
          } 
        }
      );
    }
    
    console.log("✅ Request body parsed successfully");
    console.log("📦 Raw request data:", JSON.stringify(data));
    
    // Extract and validate required parameters
    // IMPORTANT: Support both StringSession and sessionString parameter names
    const { operation, apiId, apiHash, phoneNumber, accountId, StringSession, sessionString, verificationCode } = data;
    
    // Log exact parameter names received for debugging
    console.log("📦 Parameters received:", {
      hasOperation: !!operation,
      hasApiId: !!apiId,
      hasApiHash: !!apiHash,
      hasPhoneNumber: !!phoneNumber,
      hasStringSession: !!StringSession,
      hasSessionString: !!sessionString,
      // Parameter names exactly as they appear in the request
      parameterNames: Object.keys(data).join(', ')
    });
    
    // Prepare clientParams for router
    const clientParams = {
      apiId: apiId,
      apiHash: apiHash || "",
      phoneNumber: phoneNumber || "",
      accountId: accountId || "unknown",
      sessionString: sessionString || StringSession || ""  // Try sessionString first, fall back to StringSession
    };
    
    console.log("🔄 Routing to operation:", operation);
    console.log("🔄 Client params:", {
      apiId: clientParams.apiId,
      apiIdType: typeof clientParams.apiId,
      hasApiHash: !!clientParams.apiHash,
      hasPhoneNumber: !!clientParams.phoneNumber,
      sessionLength: (clientParams.sessionString || "").length
    });
    
    // Route the request to the appropriate handler
    return await routeOperation(operation, clientParams, data);
    
  } catch (error) {
    console.error("❌ Unhandled error in handler:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "An unknown error occurred" 
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' 
        } 
      }
    );
  }
}
