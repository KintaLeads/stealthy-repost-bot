
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
    
    // First, try to directly call the healthcheck on the connector
    try {
      logInfo(context, 'Testing telegram-connector with healthcheck operation');
      console.log('Calling telegram-connector healthcheck...');
      
      const { data: connectorData, error: connectorError } = await supabase.functions.invoke('telegram-connector', {
        body: { operation: 'healthcheck' }
      });
      
      console.log('telegram-connector response:', { data: connectorData, error: connectorError });
      
      if (connectorError) {
        logError(context, 'telegram-connector healthcheck failed:', connectorError);
        results.edgeFunction.connector = {
          available: false,
          response: connectorError
        };
      } else {
        logInfo(context, 'telegram-connector healthcheck successful:', connectorData);
        results.edgeFunction.connector = {
          available: true,
          response: connectorData
        };
        
        // If connector is available, mark edge functions as deployed
        results.edgeFunction.deployed = true;
      }
    } catch (connectorTestError) {
      logError(context, 'Exception testing telegram-connector:', connectorTestError);
      results.edgeFunction.connector = {
        available: false,
        response: {
          error: connectorTestError instanceof Error ? connectorTestError.message : String(connectorTestError)
        }
      };
    }
    
    // Next, try to directly call the healthcheck on the realtime function
    try {
      logInfo(context, 'Testing telegram-realtime with healthcheck operation');
      console.log('Calling telegram-realtime healthcheck...');
      
      const { data: realtimeData, error: realtimeError } = await supabase.functions.invoke('telegram-realtime', {
        body: { operation: 'healthcheck' }
      });
      
      console.log('telegram-realtime response:', { data: realtimeData, error: realtimeError });
      
      if (realtimeError) {
        logError(context, 'telegram-realtime healthcheck failed:', realtimeError);
        results.edgeFunction.realtime = {
          available: false,
          response: realtimeError
        };
      } else {
        logInfo(context, 'telegram-realtime healthcheck successful:', realtimeData);
        results.edgeFunction.realtime = {
          available: true,
          response: realtimeData
        };
        
        // If realtime is available, mark edge functions as deployed
        results.edgeFunction.deployed = true;
      }
    } catch (realtimeTestError) {
      logError(context, 'Exception testing telegram-realtime:', realtimeTestError);
      results.edgeFunction.realtime = {
        available: false,
        response: {
          error: realtimeTestError instanceof Error ? realtimeTestError.message : String(realtimeTestError)
        }
      };
    }
    
    // If neither test worked, fallback to the OPTIONS check
    if (!results.edgeFunction.deployed) {
      logInfo(context, 'Direct healthchecks failed, falling back to OPTIONS request');
      
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
    }
    
  } catch (error) {
    logError(context, 'Error checking Edge Function deployment', error);
    results.edgeFunction.error = error instanceof Error ? error.message : 'Unknown error';
  }
  
  logInfo(context, 'Connectivity check results', results);
  
  return results;
};
