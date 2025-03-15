
import { ApiAccount } from '@/types/channels';
import { supabase } from '@/integrations/supabase/client';
import { logInfo, logError, trackApiCall, consoleLogger } from './debugger';
import { getStoredSession, storeSession } from './session/sessionManager';
import { ConnectionResult } from './types';
import { toast } from '@/components/ui/use-toast';

/**
 * Creates a properly formatted session object for Telegram API.
 * Ensures that `[NONE]` is treated as an empty session.
 */
const prepareSession = (session: string | null | undefined): string => {
  if (!session || session.trim() === "" || session.trim().toUpperCase() === "[NONE]") {
    logInfo("TelegramConnector", "Using a new empty StringSession.");
    return ""; // Return empty string - will be turned into StringSession in edge function
  }

  try {
    logInfo("TelegramConnector", "Using existing session string.");
    return session.trim();
  } catch (error) {
    logError("TelegramConnector", "Error processing session string:", error);
    return ""; // Fallback to empty session
  }
};

/**
 * Handles the initial connection to Telegram.
 */
export const handleInitialConnection = async (
  account: ApiAccount,
  options: Record<string, any> = {}
): Promise<ConnectionResult> => {
  const context = 'TelegramConnector';
  logInfo(context, `🚀 Starting Telegram connection for account: ${account.nickname || account.phoneNumber}`);
  
  try {
    // Get session string from storage
    let sessionString = getStoredSession(account.id);
    
    // Convert session to proper format
    sessionString = prepareSession(sessionString);
    
    logInfo(context, `📦 Session check - exists: ${!!sessionString}, length: ${sessionString.length}`);

    // Validate API ID
    const apiId = parseInt(account.apiKey, 10);
    if (isNaN(apiId) || apiId <= 0) {
      throw new Error(`Invalid API ID: "${account.apiKey}" is not a valid number`);
    }

    // Construct final payload for API request
    const connectionData = {
      operation: 'connect', 
      apiId: apiId,
      apiHash: account.apiHash,
      phoneNumber: account.phoneNumber,
      accountId: account.id || 'unknown',
      sessionString: sessionString,
      debug: true,
      logLevel: 'verbose'
    };

    // Log the payload details with sensitive data redacted
    logInfo(context, '📤 API Payload:', {
      ...connectionData,
      apiHash: '[REDACTED]',
      sessionString: sessionString ? `[${sessionString.length} chars]` : '[empty]'
    });
    
    // Additional console logging for API payload tracking
    console.log('🚀 Final API Payload Before Sending:', {
      ...connectionData,
      apiHash: '[REDACTED]',
      sessionString: sessionString ? `[sessionString: ${sessionString.length} chars]` : '[empty sessionString]'
    });

    // Track API credentials for debugging
    trackApiCall(
      'connector/connect',
      connectionData, 
      null, 
      null
    );

    // Prepare API request details
    const projectId = 'eswfrzdqxsaizkdswxfn';
    const requestUrl = `https://${projectId}.supabase.co/functions/v1/telegram-connector`;

    // Get authentication token
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token || '';
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzd2ZyemRxeHNhaXprZHN3eGZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5ODM2ODQsImV4cCI6MjA1NjU1OTY4NH0.2onrHJHapQZbqi7RgsuK7A6G5xlJrNSgRv21_mUT7ik';

    // Set a significantly longer timeout to prevent premature aborts
    // Edge functions can take longer to cold boot
    const TIMEOUT_MS = 60000; // 60 seconds timeout
    
    // Create an abort controller that won't trigger prematurely
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.log(`Request timed out after ${TIMEOUT_MS/1000} seconds`);
    }, TIMEOUT_MS);
    
    try {
      console.log(`Sending request to ${requestUrl}`);
      
      // Add additional tracking for the request start
      trackApiCall(
        'connector/connect/attempt',
        { ...connectionData, timestamp: new Date().toISOString() },
        null, 
        null
      );
      
      // Use a more robust fetch with retry mechanism
      let retries = 0;
      const MAX_RETRIES = 2;
      let lastError = null;
      
      while (retries <= MAX_RETRIES) {
        try {
          if (retries > 0) {
            console.log(`Retry attempt ${retries}/${MAX_RETRIES}`);
            // Small delay between retries
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
          const response = await fetch(requestUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
              'apikey': anonKey,
              // Prevent caching issues
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache'
            },
            body: JSON.stringify(connectionData),
            signal: controller.signal,
            // Adding cache control
            cache: 'no-store'
          });
          
          // Clear the timeout since request completed
          clearTimeout(timeoutId);
          
          // Check if response is not ok
          if (!response.ok) {
            const errorText = await response.text();
            console.log(`Request failed with status: ${response.status}`);
            console.log(`Error response: ${errorText}`);
            throw new Error(`HTTP error ${response.status}: ${errorText}`);
          }

          const data = await response.json();
          console.log("Response received:", data);

          // Track the API response
          trackApiCall(
            'connector/connect/response',
            connectionData, 
            data, 
            null
          );

          // If session needs verification
          if (data.codeNeeded) {
            toast({
              title: "Verification Required",
              description: "Enter the verification code sent to your Telegram app",
            });

            return {
              success: true,
              codeNeeded: true,
              phoneCodeHash: data.phoneCodeHash
            };
          }

          // Store the new session if provided
          if (data.session) {
            storeSession(account.id, data.session);
            logInfo(context, `📦 Session stored for account ${account.id}`);
          }

          toast({
            title: "Connected Successfully",
            description: "Your Telegram account is now connected",
          });

          return {
            success: true,
            session: data.session,
            user: data.user
          };
        } catch (fetchError) {
          lastError = fetchError;
          console.error(`Fetch attempt ${retries+1} failed:`, fetchError);
          retries++;
          
          // If it's not a timeout/abort error, don't retry
          if (fetchError.name !== 'AbortError' && !fetchError.message?.includes('abort') && retries > MAX_RETRIES) {
            break;
          }
        }
      }
      
      // If we got here, all retries failed
      throw lastError || new Error('All connection attempts failed');
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Log detailed information about the fetch error
      console.error('Detailed fetch error:', {
        name: fetchError.name,
        message: fetchError.message,
        cause: fetchError.cause,
        stack: fetchError.stack
      });
      
      throw fetchError;
    }
  } catch (error) {
    logError(context, '💥 Connection error:', error);
    console.error('Full error details:', error);

    toast({
      title: "Connection Error",
      description: error instanceof Error ? error.message : 'An unknown error occurred',
      variant: "destructive",
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
};

// Export for external use
export const connectToTelegram = handleInitialConnection;
