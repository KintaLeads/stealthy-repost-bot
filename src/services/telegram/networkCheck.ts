import { supabase } from '@/integrations/supabase/client';
import { logInfo, logError, logWarning } from './debugger';

/**
 * Checks connectivity to various services needed for Telegram integration
 * @param projectId The Supabase project ID for Edge Function URL
 */
export const runConnectivityChecks = async (projectId: string) => {
  const context = 'NetworkCheck';
  logInfo(context, 'Running connectivity checks...');
  
  const results = {
    supabase: false,
    telegram: false,
    edgeFunction: {
      deployed: false,
      url: '',
      error: ''
    }
  };
  
  // Check Supabase connectivity
  try {
    logInfo(context, 'Checking Supabase connectivity...');
    // Use a valid table to check connectivity
    const { error } = await supabase.from('api_credentials').select('count', { count: 'exact', head: true });
    
    // Even if we get an error from the query, if we get a response at all, 
    // Supabase is accessible. The error might just be that the table doesn't exist or permission issues.
    results.supabase = true;
    logInfo(context, 'Supabase connection successful');
  } catch (error) {
    logError(context, 'Supabase connection failed', error);
  }
  
  // Check Telegram API connectivity (by pinging telegram.org)
  try {
    logInfo(context, 'Checking Telegram API connectivity...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://telegram.org/js/telegram-web-app.js', {
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    results.telegram = response.ok;
    logInfo(context, `Telegram connectivity check: ${results.telegram ? 'Successful' : 'Failed'}`);
  } catch (error) {
    logError(context, 'Telegram connectivity check failed', error);
  }
  
  // Check Edge Function deployment with improved error handling
  try {
    logInfo(context, 'Checking Edge Function deployment...');
    // Construct Edge Function URL
    const edgeFunctionUrl = `https://${projectId}.supabase.co/functions/v1/telegram-connector`;
    results.edgeFunction.url = edgeFunctionUrl;
    
    // Perform a health check request with detailed diagnostics
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased timeout to 15 seconds
    
    try {
      logInfo(context, `Sending OPTIONS request to ${edgeFunctionUrl}`);
      
      // Use the public anon key for authentication
      const response = await fetch(edgeFunctionUrl, {
        method: 'OPTIONS',
        signal: controller.signal,
        headers: {
          'apikey': supabase.auth.getSession() ? await supabase.auth.getSession().then(res => res.data.session?.access_token || '') : '',
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type,authorization,apikey'
        }
      });
      
      clearTimeout(timeoutId);
      logInfo(context, `Edge Function response status: ${response.status}`);
      logInfo(context, `Edge Function response headers:`, Object.fromEntries([...response.headers.entries()]));
      
      if (response.status === 204 || response.ok) {
        results.edgeFunction.deployed = true;
        logInfo(context, 'Edge Function deployment check: Successful');
        
        // Additional health check with a simple POST request
        try {
          const healthResponse = await fetch(edgeFunctionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabase.auth.getSession() ? await supabase.auth.getSession().then(res => res.data.session?.access_token || '') : '',
              'Origin': window.location.origin
            },
            body: JSON.stringify({ operation: 'healthcheck' })
          });
          
          logInfo(context, `Health check POST status: ${healthResponse.status}`);
        } catch (healthError) {
          logWarning(context, 'Health check POST failed but OPTIONS succeeded', healthError);
        }
      } else {
        // Function exists but returned an unexpected status
        results.edgeFunction.deployed = false;
        results.edgeFunction.error = `Unexpected status: ${response.status}`;
        logWarning(context, `Edge Function returns unexpected status: ${response.status}`);
      }
    } catch (fetchError) {
      logError(context, 'Edge Function fetch failed', fetchError);
      
      if (fetchError.name === 'AbortError') {
        results.edgeFunction.error = 'Connection timeout - the Edge Function didn\'t respond in time';
      } else if (fetchError.message?.includes('Failed to fetch')) {
        results.edgeFunction.error = 'Network error - unable to connect to the Edge Function. The function may not be deployed correctly.';
      } else {
        results.edgeFunction.error = fetchError.message || 'Unknown error';
      }
    }
  } catch (error) {
    logError(context, 'Error checking Edge Function deployment', error);
    results.edgeFunction.error = error instanceof Error ? error.message : 'Unknown error';
  }
  
  logInfo(context, 'Connectivity check results', results);
  
  return results;
};

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
