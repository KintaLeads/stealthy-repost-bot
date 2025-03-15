
import { TelegramClient } from "https://esm.sh/telegram@2.19.10";
import { StringSession } from "https://esm.sh/telegram@2.19.10/sessions/index.js";
import { routeOperation } from "./router.ts";
import { handleCorsRequest, parseRequestBody, validateApiParameters } from "./utils/requestHandler.ts";

export async function handler(req: Request) {
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
    
    // Extract and validate required parameters
    // IMPORTANT: Support both StringSession and sessionString parameter names
    const { operation, apiId, apiHash, phoneNumber, accountId, StringSession, sessionString, verificationCode } = data;
    
    // Log exact parameter names received for debugging
    console.log("📦 Parameters received:", {
      hasOperation: !!operation,
      hasApiId: !!apiId,
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
      sessionString: StringSession || sessionString || ""  // Try StringSession first, fall back to sessionString
    };
    
    console.log("🔄 Routing to operation:", operation);
    
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
