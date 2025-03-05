
import { supabase } from '@/integrations/supabase/client';
import { logInfo, logError } from './debugger';

/**
 * Tests if CORS is configured correctly for Supabase Edge Functions with detailed diagnostics
 */
export const testCorsConfiguration = async (projectId: string) => {
  const context = 'CorsTest';
  logInfo(context, 'Testing CORS configuration...');
  
  try {
    const edgeFunctionUrl = `https://${projectId}.supabase.co/functions/v1/telegram-connector`;
    
    // Log the exact request we're about to make
    const requestDetails = {
      url: edgeFunctionUrl,
      method: 'OPTIONS',
      headers: {
        'Origin': window.location.origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization,apikey'
      }
    };
    
    logInfo(context, 'Sending CORS preflight request with details:', requestDetails);
    
    // First try with OPTIONS request
    const optionsResponse = await fetch(edgeFunctionUrl, {
      method: 'OPTIONS',
      headers: {
        'Origin': window.location.origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization,apikey'
      }
    });
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': optionsResponse.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': optionsResponse.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': optionsResponse.headers.get('Access-Control-Allow-Headers')
    };
    
    // Get all response headers for debugging
    const allResponseHeaders = Object.fromEntries([...optionsResponse.headers.entries()]);
    
    logInfo(context, 'CORS preflight response', {
      status: optionsResponse.status,
      corsHeaders: corsHeaders,
      allHeaders: allResponseHeaders
    });
    
    // Now try a simple POST request to check actual CORS behavior
    try {
      const testPostResponse = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': window.location.origin,
          'apikey': supabase.auth.getSession() ? await supabase.auth.getSession().then(res => res.data.session?.access_token || '') : ''
        },
        body: JSON.stringify({ operation: 'healthcheck' })
      });
      
      logInfo(context, 'POST test response', {
        status: testPostResponse.status,
        statusText: testPostResponse.statusText,
        headers: Object.fromEntries([...testPostResponse.headers.entries()]),
        ok: testPostResponse.ok
      });
      
      return {
        success: optionsResponse.status === 204,
        status: optionsResponse.status,
        corsHeaders,
        postTest: {
          success: testPostResponse.ok,
          status: testPostResponse.status
        }
      };
    } catch (postError) {
      logError(context, 'POST test failed', postError);
      
      return {
        success: optionsResponse.status === 204,
        status: optionsResponse.status,
        corsHeaders,
        postTest: {
          success: false,
          error: postError instanceof Error ? postError.message : 'Unknown error'
        }
      };
    }
  } catch (error) {
    logError(context, 'CORS test failed', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
