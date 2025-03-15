
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
    // CRITICAL FIX: Use StringSession instead of sessionString in the payload
    const connectionData = {
      operation: 'connect', 
      apiId: apiId,
      apiHash: account.apiHash,
      phoneNumber: account.phoneNumber,
      accountId: account.id || 'unknown',
      StringSession: sessionString, // Critical: Must use StringSession not sessionString
      debug: true,
      logLevel: 'verbose',
      ...options
    };

    // Log the payload details with sensitive data redacted
    logInfo(context, '📤 API Payload:', {
      ...connectionData,
      apiHash: '[REDACTED]',
      StringSession: sessionString ? `[${sessionString.length} chars]` : '[empty]'
    });
    
    // Additional console logging for API payload tracking
    console.log('🚀 Final API Payload Before Sending:', {
      ...connectionData,
      apiHash: '[REDACTED]',
      StringSession: sessionString ? `[StringSession: ${sessionString.length} chars]` : '[empty StringSession]'
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

    // **Retry Mechanism with Timeout**: Attempts up to 3 times with abort controller
    let retries = 0;
    const maxRetries = 2;
    let lastError = null;

    while (retries <= maxRetries) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
          console.log("Request timed out after 30 seconds");
        }, 30000); // 30 second timeout
        
        try {
          const response = await fetch(requestUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
              'apikey': anonKey
            },
            body: JSON.stringify(connectionData),
            signal: controller.signal
          });
          
          // Clear the timeout since request completed
          clearTimeout(timeoutId);
          
          // Check if response is not ok
          if (!response.ok) {
            console.log(`Request failed with status: ${response.status}`);
            const errorText = await response.text();
            console.log(`Error response: ${errorText}`);
            throw new Error(`HTTP error ${response.status}: ${errorText}`);
          }

          const data = await response.json();

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
          clearTimeout(timeoutId);
          throw fetchError;
        }

      } catch (error) {
        console.error(`❌ Connection error (attempt ${retries + 1}/${maxRetries + 1}):`, error);
        
        // Special handling for AbortError (timeout)
        if (error.name === 'AbortError') {
          lastError = new Error('Connection timed out. The server took too long to respond.');
        } else {
          lastError = error;
        }
        
        // Track the API error
        trackApiCall(
          'connector/connect/error',
          connectionData, 
          null, 
          lastError
        );
      }

      retries++;
      if (retries <= maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * retries)); // Exponential backoff
      }
    }

    throw lastError || new Error('Failed to connect after multiple attempts');

  } catch (error) {
    logError(context, '💥 Connection error:', error);

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
