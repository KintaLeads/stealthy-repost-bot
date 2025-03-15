
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
      error: '',
      connector: {
        available: false,
        response: null
      },
      realtime: {
        available: false,
        response: null
      }
    },
    networkConnectivity: {
      internetAccess: false,
      dnsResolution: false,
      error: ''
    }
  };
  
  // Check basic internet connectivity
  try {
    logInfo(context, 'Checking internet connectivity...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    // Use a reliable service to check connectivity
    const response = await fetch('https://www.cloudflare.com/cdn-cgi/trace', {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    results.networkConnectivity.internetAccess = response.ok;
    logInfo(context, `Internet connectivity: ${results.networkConnectivity.internetAccess ? 'Available' : 'Not available'}`);
  } catch (error) {
    logError(context, 'Internet connectivity check failed', error);
    results.networkConnectivity.error = error instanceof Error ? error.message : 'Unknown error';
  }
  
  // Check Supabase connectivity
  try {
    logInfo(context, 'Checking Supabase connectivity...');
    const { error } = await supabase.from('api_credentials').select('count', { count: 'exact', head: true });
    
    results.supabase = true;
    logInfo(context, 'Supabase connection successful');
  } catch (error) {
    logError(context, 'Supabase connection failed', error);
  }
  
  // Check Telegram API connectivity
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
  
  // Check Edge Function with direct testing
  try {
    logInfo(context, 'Testing edge function connectivity...');
    const edgeFunctionUrl = `https://${projectId}.supabase.co/functions/v1/telegram-connector`;
    results.edgeFunction.url = edgeFunctionUrl;
    
    // Try OPTIONS request first
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(edgeFunctionUrl, {
        method: 'OPTIONS',
        signal: controller.signal,
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type,authorization,apikey',
        }
      });
      
      clearTimeout(timeoutId);
      
      results.edgeFunction.deployed = response.status === 204 || response.ok;
      
      // Log the response headers for debugging
      const headers = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      
      logInfo(context, 'OPTIONS response headers:', headers);
      
      if (!results.edgeFunction.deployed) {
        results.edgeFunction.error = `OPTIONS request failed with status: ${response.status}`;
      }
    } catch (corsError) {
      logError(context, 'CORS preflight check failed', corsError);
      results.edgeFunction.error = corsError instanceof Error ? corsError.message : 'Unknown CORS error';
    }
    
    // Try test request to edge function
    try {
      const { data, error } = await supabase.functions.invoke('telegram-connector', {
        body: { operation: 'healthcheck' }
      });
      
      if (error) {
        logError(context, 'Edge function healthcheck failed:', error);
      } else {
        logInfo(context, 'Edge function healthcheck successful:', data);
        results.edgeFunction.connector.available = true;
        results.edgeFunction.connector.response = data;
      }
    } catch (invocationError) {
      logError(context, 'Edge function invocation failed', invocationError);
    }
    
  } catch (error) {
    logError(context, 'Error checking Edge Function deployment', error);
    results.edgeFunction.error = error instanceof Error ? error.message : 'Unknown error';
  }
  
  logInfo(context, 'Connectivity check results', results);
  
  return results;
};
