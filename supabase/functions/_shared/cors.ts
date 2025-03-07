
// Define CORS headers for Edge Functions
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-telegram-session',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',  // Cache preflight request for 24 hours
  'Access-Control-Expose-Headers': 'x-telegram-session', // Expose the custom header
  'Content-Type': 'application/json'
};
