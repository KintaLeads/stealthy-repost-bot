
import { ApiAccount } from '@/types/channels';
import { supabase } from '@/integrations/supabase/client';
import { logInfo, logError, trackApiCall } from './debugger';
import { getStoredSession } from './session/sessionManager';
import { ConnectionResult } from './types';

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
    
    const connectionData = {
      operation: 'connect', 
      apiId: account.apiKey,
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
    
    const { data, error } = await supabase.functions.invoke('telegram-connector', {
      body: connectionData,
      headers: {
        'Content-Type': 'application/json',
        ...(sessionString ? { 'X-Telegram-Session': sessionString } : {})
      }
    });
    
    // Track API call
    trackApiCall('telegram-connector/connect', {
      ...connectionData,
      apiHash: '[REDACTED]'
    }, data, error);
    
    if (error) {
      logError(context, '❌ Edge function error:', error);
      throw new Error(error.message || 'Edge Function error: ' + error.name);
    }
    
    if (!data) {
      logError(context, '❌ No data returned from Edge Function');
      throw new Error('No response from Edge Function');
    }
    
    logInfo(context, '📥 Edge function response:', {
      success: data.success,
      codeNeeded: data.codeNeeded,
      hasSession: !!data.session,
      error: data.error
    });
    
    if (!data.success) {
      logError(context, '❌ Connection failed:', data.error);
      return {
        success: false,
        error: data.error || 'Failed to connect to Telegram',
        details: data.details
      };
    }
    
    // Check if verification is needed
    if (data.codeNeeded) {
      logInfo(context, '📱 Verification code needed');
      return {
        success: true,
        codeNeeded: true,
        phoneCodeHash: data.phoneCodeHash,
        _testCode: data._testCode
      };
    }
    
    // Connection successful
    logInfo(context, '✅ Connection successful, session received');
    return {
      success: true,
      codeNeeded: false,
      session: data.session,
      user: data.user
    };
    
  } catch (error) {
    logError(context, '💥 Connection error:', error);
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
