
// Healthcheck operation handler for the Telegram connector

import { corsHeaders } from "../../_shared/cors.ts";

/**
 * Handles the healthcheck operation
 */
export function handleHealthcheck(corsHeaders: Record<string, string>): Response {
  console.log("✅ Processing healthcheck operation");
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      message: "Telegram connector is running", 
      version: "2.26.22"
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}
