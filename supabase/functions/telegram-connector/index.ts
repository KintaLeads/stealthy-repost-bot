
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { routeOperation } from "./router.ts";
import { parseRequestBody, handleCorsRequest } from "./utils/requestHandler.ts";

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Cache-Control': 'no-store, no-cache, must-revalidate'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return handleCorsRequest();
  }
  
  try {
    // Parse and validate request body
    const { valid, data, error } = await parseRequestBody(req);
    
    if (!valid || !data) {
      console.error("Invalid request:", error);
      return new Response(
        JSON.stringify({ success: false, error: error || "Invalid request" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Extract operation and client parameters
    const { operation, apiId, apiHash, phoneNumber, accountId, sessionString, ...otherParams } = data;
    
    console.log(`Request received for operation: ${operation}`, {
      hasApiId: !!apiId,
      hasApiHash: !!apiHash,
      hasPhoneNumber: !!phoneNumber,
      hasAccountId: !!accountId,
      hasSession: !!sessionString,
      sessionLength: sessionString?.length || 0,
      otherParamsKeys: Object.keys(otherParams)
    });
    
    // For debugging, explicitly log the full payload for the connect operation
    if (operation === 'connect') {
      console.log(JSON.stringify({
        operation,
        apiId,
        apiHash: apiHash ? `${apiHash.substring(0, 3)}...` : 'missing',
        phoneNumber: phoneNumber ? `${phoneNumber.substring(0, 4)}****` : 'missing',
        sessionLength: sessionString?.length || 0
      }));
    }
    
    // Route the operation to the appropriate handler
    const response = await routeOperation(
      operation,
      { apiId, apiHash, phoneNumber, accountId, sessionString },
      data
    );
    
    return response;
  } catch (error) {
    console.error("Unhandled error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "An unknown error occurred",
        stack: error instanceof Error ? error.stack : null
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
