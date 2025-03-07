
import { ApiAccount } from '@/types/channels';
import { supabase } from '@/integrations/supabase/client';
import { logInfo, logError, trackApiCall } from './debugger';
import { getStoredSession, clearStoredSession } from './sessionManager';

/**
 * Verifies a Telegram verification code
 * @param account The API account being verified
 * @param code The verification code received from Telegram
 * @param options Additional options for verification
 * @returns Boolean indicating success or failure
 */
export const verifyTelegramCode = async (
  account: ApiAccount, 
  code: string, 
  options: Record<string, any> = {}
) => {
  const context = 'TelegramVerifier';
  logInfo(context, `Verifying code for account: ${account.nickname || account.phoneNumber}`);
  
  try {
    // First, check if we have an existing session to include
    const sessionString = getStoredSession(account.id);
    logInfo(context, `Current session exists: ${!!sessionString}`);
    
    const requestData = {
      operation: 'connect', // Changed from 'verify' to 'connect' to match edge function expectations
      apiId: account.apiKey,
      apiHash: account.apiHash,
      phoneNumber: account.phoneNumber,
      verificationCode: code,
      accountId: account.id || 'unknown',
      sessionString: sessionString || '',
      debug: options.debug || false,
      ...options
    };
    
    logInfo(context, 'Calling Supabase function \'telegram-connector\' for verification...');
    
    const { data, error } = await supabase.functions.invoke('telegram-connector', {
      body: requestData,
      headers: sessionString ? { 'X-Telegram-Session': sessionString } : {}
    });
    
    // Track API call for debugging
    trackApiCall('telegram-connector/connect', requestData, data, error);
    
    if (error) {
      logError(context, 'Error verifying Telegram code:', error);
      
      // If we get a 401, clear the stored session as it's no longer valid
      if (error.status === 401) {
        clearStoredSession(account.id);
      }
      
      throw new Error(error.message || 'Failed to verify Telegram code');
    }
    
    if (!data.success) {
      logError(context, 'Verification failed:', data.error);
      throw new Error(data.error || 'Invalid verification code');
    }
    
    // If we have a session in the response, store it
    if (data.session) {
      // Update the stored session for this account
      const sessionString = data.session;
      
      // This will be implemented in the session manager
      setStoredSession(account.id, sessionString);
      
      logInfo(context, 'Updated session for account:', account.id);
    }
    
    logInfo(context, 'Verification successful');
    return true;
  } catch (error) {
    logError(context, 'Exception during verification:', error);
    throw error;
  }
};

// Helper to store the session
const setStoredSession = (accountId: string, sessionString: string) => {
  try {
    localStorage.setItem(`telegram_session_${accountId}`, sessionString);
    return true;
  } catch (error) {
    console.error('Error storing session:', error);
    return false;
  }
};
