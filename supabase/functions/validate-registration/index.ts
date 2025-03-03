
// Import CORS headers
import { corsHeaders } from "../_shared/cors.ts";

// Handle registration code validation
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the registration code from the request
    const { code } = await req.json();
    
    // Log the received code for debugging
    console.log(`Validating registration code: ${code}`);
    
    // Check if the code matches the secret code (1708)
    const isValid = code === '1708';
    
    // Return the validation result
    return new Response(
      JSON.stringify({ 
        valid: isValid,
        message: isValid ? 'Registration code validated successfully' : 'Invalid registration code'
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error validating registration code:", error.message);
    
    // Return error response
    return new Response(
      JSON.stringify({ 
        valid: false, 
        message: `Error validating registration code: ${error.message}` 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400 
      }
    );
  }
});
