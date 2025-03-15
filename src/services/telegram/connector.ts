import { ApiAccount } from '@/types/channels';
import { supabase } from '@/integrations/supabase/client';
import { logInfo, logError, trackApiCall, consoleLogger } from './debugger';
import { getStoredSession, storeSession } from './session/sessionManager';
import { ConnectionResult } from './types';
import { toast } from '@/components/ui/use-toast';
import { StringSession } from "https://esm.sh/telegram@2.19.10/sessions/index.js";

/**
 * Converts a session string into a properly formatted StringSession object.
 * Ensures that `[NONE]` is treated as an empty session.
 */
const prepareSession = (session: string | null | undefined): string => {
  if (!session || session.trim() === "" || session.trim().toUpperCase() === "[NONE]") {
    logInfo("TelegramConnector", "Using a new empty StringSession.");
    return new StringSession("").save(); // Always return a valid session format
  }

  try {
    const stringSession = new StringSession(session.trim());
    logInfo("TelegramConnector", "Converted session successfully.");
    return stringSession.save();
  } catch (error) {
    logError("TelegramConnector", "Error converting session to StringSession:", error);
    return new StringSession("").save(); // Fallback to empty session
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
      sessionString, // ✅ Always a valid StringSession now
      debug: true,
      logLevel: 'verbose',
      ...options
    };

    logInfo(context, '📤 Final Connection Data:', {
      ...connectionData,
      apiHash: '[REDACTED]',
      sessionString: sessionString ? `[${sessionString.length} chars]` : ''
    });

    // Prepare API request details
    const projectId = 'eswfrzdqxsaizkdswxfn';
    const requestUrl = `https://${projectId}.supabase.co/functions/v1/telegram-connector`;

    // Get authentication token
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token || '';
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzd2ZyemRxeHNhaXprZHN3eGZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5ODM2ODQsImV4cCI6MjA1NjU1OTY4NH0.2onrHJHapQZbqi7RgsuK7A6G5xlJrNSgRv21_mUT7ik';

    // **Retry Mechanism**: Attempts up to 3 times
    let retries = 0;
    const maxRetries = 2;
    let lastError = null;

    while (retries <= maxRetries) {
      try {
        const response = await fetch(requestUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
            'apikey': anonKey
          },
          body: JSON.stringify(connectionData) // ✅ Always sending a valid session format
        });

        const data = await response.json();

        if (!response.ok) {
          logError(context, `❌ Edge function error: HTTP ${response.status}`, data);
          lastError = new Error(data.error || `HTTP error ${response.status}`);
          throw lastError;
        }

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

      } catch (error) {
        logError(context, `❌ Connection error (attempt ${retries + 1}/${maxRetries + 1}):`, error);
        lastError = error;
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
