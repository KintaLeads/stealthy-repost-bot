
import { ApiAccount } from '@/types/channels';
import { supabase } from '@/integrations/supabase/client';
import { logInfo, logError, trackApiCall, consoleLogger } from './debugger'; // Added consoleLogger import
import { getStoredSession } from './session/sessionManager';
import { ConnectionResult } from './types';
import { toast } from '@/components/ui/use-toast';

/**
 * Handles the initial connection to Telegram
 */
export const handleInitialConnection = async (
  account: ApiAccount,
  options: Record<string, any> = {}
): Promise<ConnectionResult> => {
  const context = 'TelegramConnector';
  logInfo(context, `🚀 Starting Telegram connection for account: ${account.nickname || account.phoneNumber}`);
  
  try {
    // Check for existing session
    const sessionString = getStoredSession(account.id);
    logInfo(context, `📦 Session check - exists: ${!!sessionString}, length: ${sessionString?.length || 0}`);

    // Log the account data for debugging
    consoleLogger.trackApiPayload(
      'services/telegram/connector.ts',
      'handleInitialConnection',
      'start-connection',
      parseInt(account.apiKey, 10), // Ensure API ID is a number here
      account.apiHash,
      account.phoneNumber,
      { accountId: account.id, sessionExists: !!sessionString }
    );
    
    // Parse apiKey to ensure it's a number
    const apiId = parseInt(account.apiKey, 10);
    if (isNaN(apiId)) {
      throw new Error(`Invalid API ID: "${account.apiKey}" is not a valid number`);
    }
    
    // Log after conversion
    consoleLogger.trackApiPayload(
      'services/telegram/connector.ts',
      'handleInitialConnection',
      'after-conversion',
      apiId, // Already a number here
      account.apiHash,
      account.phoneNumber,
      { accountId: account.id, originalApiKey: account.apiKey }
    );
    
    // Explicitly build connection data as a separate object for clarity
    const connectionData = {
      operation: 'connect', 
      apiId: apiId,  // Now sending as a number (integer)
      apiHash: account.apiHash,
      phoneNumber: account.phoneNumber,
      accountId: account.id || 'unknown',
      sessionString: sessionString || '',
      debug: true, // Always enable debug mode
      logLevel: 'verbose',
      ...options
    };
    
    // Log connection attempt with sanitized data
    logInfo(context, '📤 Connection data:', {
      ...connectionData,
      apiHash: '[REDACTED]',
      sessionString: sessionString ? `[${sessionString.length} chars]` : '[NONE]'
    });
    
    // Call the edge function
    logInfo(context, '⚡ Calling telegram-connector edge function');
    console.log('Making direct call to telegram-connector edge function');
    
    // Add a toast to show we're connecting
    toast({
      title: "Connecting to Telegram",
      description: "Please wait while we establish a connection...",
    });
    
    // Track the constructed payload
    consoleLogger.trackApiPayload(
      'services/telegram/connector.ts',
      'handleInitialConnection',
      'before-api-call',
      connectionData.apiId, // Now a number
      connectionData.apiHash,
      connectionData.phoneNumber,
      { 
        operation: connectionData.operation,
        accountId: connectionData.accountId
      }
    );
    
    // Add retries for better reliability
    let retries = 0;
    const maxRetries = 2;
    let lastError = null;
    
    while (retries <= maxRetries) {
      try {
        // Use direct fetch instead of supabase.functions.invoke which might be having issues
        const projectId = 'eswfrzdqxsaizkdswxfn';
        const requestUrl = `https://${projectId}.supabase.co/functions/v1/telegram-connector`;
        
        // Get the access token from session
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token || '';
        const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzd2ZyemRxeHNhaXprZHN3eGZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5ODM2ODQsImV4cCI6MjA1NjU1OTY4NH0.2onrHJHapQZbqi7RgsuK7A6G5xlJrNSgRv21_mUT7ik';
        
        console.log(`Sending direct fetch to ${requestUrl}`, {
          apiId: connectionData.apiId, // Now a number
          phoneNumber: connectionData.phoneNumber,
          accountId: connectionData.accountId,
          sessionPresent: !!sessionString
        });
        
        // First try a test request to verify connectivity
        if (retries === 0) {
          const testResponse = await fetch(requestUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
              'apikey': anonKey
            },
            body: JSON.stringify({
              operation: 'connect',
              debug: true,
              testMode: true
            })
          });
          
          const testData = await testResponse.json();
          console.log('Test connection response:', testData);
          
          if (!testResponse.ok) {
            console.error('Test connection failed:', testData);
          }
        }
        
        // Track the finalized payload right before sending
        consoleLogger.trackApiPayload(
          'services/telegram/connector.ts',
          'handleInitialConnection',
          'sending-request',
          connectionData.apiId, // Now a number
          connectionData.apiHash,
          connectionData.phoneNumber,
          { 
            endpoint: requestUrl,
            attempt: retries + 1,
            totalAttempts: maxRetries + 1
          }
        );
        
        // Make the actual request with the full data
        const response = await fetch(requestUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'apikey': anonKey,
            ...(sessionString ? { 'X-Telegram-Session': sessionString } : {})
          },
          body: JSON.stringify(connectionData) // Explicitly stringify the body
        });
        
        // Extra logging for debugging
        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));
        
        // Convert response to JSON
        const data = await response.json();
        console.log('Response data:', data);
        
        // Track API call
        trackApiCall('telegram-connector/connect', {
          ...connectionData,
          apiHash: '[REDACTED]'
        }, data, response.ok ? null : new Error(`HTTP error ${response.status}`));
        
        if (!response.ok) {
          logError(context, `❌ Edge function error: HTTP ${response.status}`, data);
          console.error('Full error response:', data);
          
          lastError = new Error(data.error || `HTTP error ${response.status}`);
          
          // Show toast with error if this is the last retry
          if (retries === maxRetries) {
            toast({
              title: "Connection Failed",
              description: data.error || `HTTP error ${response.status}`,
              variant: "destructive",
            });
            
            throw lastError;
          }
        } else if (!data) {
          logError(context, '❌ No data returned from Edge Function');
          
          lastError = new Error('No response from Edge Function');
          
          // Show toast with error if this is the last retry
          if (retries === maxRetries) {
            toast({
              title: "Connection Failed",
              description: "No response from Edge Function",
              variant: "destructive",
            });
            
            throw lastError;
          }
        } else {
          // Successfully got data, process it
          logInfo(context, '📥 Edge function response:', {
            success: data.success,
            codeNeeded: data.codeNeeded,
            hasSession: !!data.session,
            error: data.error
          });
          
          if (!data.success) {
            logError(context, '❌ Connection failed:', data.error);
            
            // Show toast with error
            toast({
              title: "Connection Failed",
              description: data.error || 'Failed to connect to Telegram',
              variant: "destructive",
            });
            
            return {
              success: false,
              error: data.error || 'Failed to connect to Telegram',
              details: data.details
            };
          }
          
          // Check if verification is needed
          if (data.codeNeeded) {
            logInfo(context, '📱 Verification code needed');
            
            // Show toast indicating verification needed
            toast({
              title: "Verification Required",
              description: "Please enter the verification code sent to your Telegram app",
            });
            
            return {
              success: true,
              codeNeeded: true,
              phoneCodeHash: data.phoneCodeHash,
              _testCode: data._testCode
            };
          }
          
          // Connection successful
          logInfo(context, '✅ Connection successful, session received');
          
          // Show success toast
          toast({
            title: "Connected Successfully",
            description: "Your Telegram account is now connected",
          });
          
          return {
            success: true,
            codeNeeded: false,
            session: data.session,
            user: data.user
          };
        }
      } catch (invokeError) {
        logError(context, `❌ Error invoking edge function (attempt ${retries + 1}/${maxRetries + 1}):`, invokeError);
        console.error(`Attempt ${retries + 1} error:`, invokeError);
        
        lastError = invokeError;
        
        // Only show toast on the last retry
        if (retries === maxRetries) {
          toast({
            title: "Connection Error",
            description: invokeError instanceof Error ? invokeError.message : 'Failed to call edge function',
            variant: "destructive",
          });
        }
      }
      
      // Increment retry counter and wait before retrying
      retries++;
      if (retries <= maxRetries) {
        const delay = 1000 * retries; // Exponential backoff: 1s, 2s
        logInfo(context, `Retrying in ${delay}ms (attempt ${retries + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // If we got here, all retries failed
    throw lastError || new Error('Failed to connect after multiple attempts');
    
  } catch (error) {
    logError(context, '💥 Connection error:', error);
    console.error('Full error details:', error);
    
    // Show toast with error
    toast({
      title: "Connection Error",
      description: error instanceof Error ? error.message : 'An unknown error occurred',
      variant: "destructive",
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
      details: error instanceof Error ? {
        name: error.name,
        stack: error.stack
      } : undefined
    };
  }
};

// Export connectToTelegram as an alias for handleInitialConnection
export const connectToTelegram = handleInitialConnection;
