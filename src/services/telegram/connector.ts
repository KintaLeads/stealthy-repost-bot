import { ApiAccount } from '@/types/channels';
import { supabase } from '@/integrations/supabase/client';
import { logInfo, logError, trackApiCall } from './debugger';
import { getStoredSession } from './sessionManager';
import { ConnectionResult } from './types';

/**
 * Handles the initial connection to Telegram
 * This will either:
 * 1. Connect directly if we have a valid session
 * 2. Request a verification code to be sent
 */
export const handleInitialConnection = async (
  account: ApiAccount,
  options: Record<string, any> = {}
): Promise<ConnectionResult> => {
  const context = 'TelegramConnector';
  logInfo(context, `Connecting to Telegram with account: ${account.nickname || account.phoneNumber}`);
  
  try {
    // Check if we have an existing session to include
    const sessionString = getStoredSession(account.id);
    logInfo(context, `Current session exists: ${!!sessionString}`);
    
    const connectionData = {
      operation: 'connect', 
      apiId: account.apiKey,
      apiHash: account.apiHash,
      phoneNumber: account.phoneNumber,
      accountId: account.id || 'unknown',
      sessionString: sessionString || '',
      debug: options.debug || true,
      ...options
    };
    
    logInfo(context, 'Calling Supabase function \'telegram-connector\' with apiId:', account.apiKey);
    
    const { data, error } = await supabase.functions.invoke('telegram-connector', {
      body: connectionData,
      headers: sessionString ? { 'X-Telegram-Session': sessionString } : {}
    });
    
    // Track API call for debugging
    trackApiCall('telegram-connector/connect', connectionData, data, error);
    
    if (error) {
      logError(context, 'Error connecting to Telegram:', error);
      
      // Check for specific error types
      if (error.message?.includes('rate limit') || error.message?.includes('Too many requests')) {
        throw new Error('Rate limited by Telegram. Please try again in a few minutes.');
      }
      
      throw new Error(error.message || 'Edge Function error: ' + error.name);
    }
    
    if (!data) {
      logError(context, 'No data returned from Edge Function');
      throw new Error('No response from Edge Function. Please check the logs.');
    }
    
    if (!data.success) {
      logError(context, 'Unsuccessful connection:', data.error);
      
      // Return a proper connection result
      return {
        success: false,
        error: data.error || 'Failed to connect to Telegram',
        details: data.details
      };
    }
    
    // If code is needed, return that information
    if (data.codeNeeded) {
      logInfo(context, 'Verification code needed.');
      
      return {
        success: true,
        codeNeeded: true,
        phoneCodeHash: data.phoneCodeHash,
        _testCode: data._testCode
      };
    }
    
    // Otherwise we're already authenticated
    logInfo(context, 'Already authenticated');
    
    return {
      success: true,
      codeNeeded: false,
      user: data.user
    };
  } catch (error) {
    logError(context, 'Exception during connection:', error);
    
    // Structured error response
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
