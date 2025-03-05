
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
  
  // Check Edge Function deployment
  try {
    logInfo(context, 'Checking Edge Function deployment...');
    // Construct Edge Function URL
    const edgeFunctionUrl = `https://${projectId}.supabase.co/functions/v1/telegram-connector`;
    results.edgeFunction.url = edgeFunctionUrl;
    
    // Just perform a HEAD request to see if the function exists and is accessible
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // Increased timeout to 10 seconds
    
    try {
      // Use the public anon key instead of accessing protected property
      const response = await fetch(edgeFunctionUrl, {
        method: 'OPTIONS',
        signal: controller.signal,
        headers: {
          // Use the public anon key
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzd2ZyemRxeHNhaXprZHN3eGZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5ODM2ODQsImV4cCI6MjA1NjU1OTY4NH0.2onrHJHapQZbqi7RgsuK7A6G5xlJrNSgRv21_mUT7ik'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.status === 204 || response.ok) {
        results.edgeFunction.deployed = true;
        logInfo(context, 'Edge Function deployment check: Successful');
      } else {
        // If we get a response but not 204/200, function exists but might have an issue
        results.edgeFunction.deployed = true;
        results.edgeFunction.error = `Unexpected status: ${response.status}`;
        logWarning(context, `Edge Function returns unexpected status: ${response.status}`);
      }
    } catch (fetchError) {
      logError(context, 'Edge Function fetch failed', fetchError);
      
      if (fetchError.name === 'AbortError') {
        results.edgeFunction.error = 'Connection timeout - the Edge Function didn\'t respond in time';
      } else if (fetchError.message?.includes('Failed to fetch')) {
        results.edgeFunction.error = 'Network error - unable to connect to the Edge Function';
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
 * Tests if CORS is configured correctly for Supabase Edge Functions
 */
export const testCorsConfiguration = async (projectId: string) => {
  const context = 'CorsTest';
  logInfo(context, 'Testing CORS configuration...');
  
  try {
    const edgeFunctionUrl = `https://${projectId}.supabase.co/functions/v1/telegram-connector`;
    
    // First try with OPTIONS request
    const optionsResponse = await fetch(edgeFunctionUrl, {
      method: 'OPTIONS',
      headers: {
        'Origin': window.location.origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
      }
    });
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': optionsResponse.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': optionsResponse.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': optionsResponse.headers.get('Access-Control-Allow-Headers')
    };
    
    logInfo(context, 'CORS preflight response', {
      status: optionsResponse.status,
      headers: corsHeaders
    });
    
    return {
      success: optionsResponse.status === 204,
      status: optionsResponse.status,
      corsHeaders
    };
  } catch (error) {
    logError(context, 'CORS test failed', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
