
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Handle CORS preflight requests
const handleCors = (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
}

// Get environment variables
const REGISTRATION_CODE = '1708'

const handleRequest = async (req: Request) => {
  try {
    const { code } = await req.json()
    
    // Validate registration code
    const isValid = code === REGISTRATION_CODE
    
    return new Response(
      JSON.stringify({ 
        valid: isValid 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
}

// Main function
Deno.serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse
  
  // Handle the request
  return handleRequest(req)
})
