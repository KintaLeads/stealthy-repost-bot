
import { ApiAccount } from '@/types/channels';
import { supabase } from '@/integrations/supabase/client';
import { logInfo, logError, trackApiCall } from './debugger';
import { getStoredSession, clearStoredSession, storeSession } from './sessionManager';
import { ConnectionResult } from './types';

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
    const phoneCodeHash = options.phoneCodeHash || localStorage.getItem(`telegram_code_hash_${account.id}`);
    
    logInfo(context, `Current session exists: ${!!sessionString}`);
    logInfo(context, `Phone code hash exists: ${!!phoneCodeHash}`);
    
    if (!phoneCodeHash) {
      logError(context, 'Missing phone code hash for verification');
      throw new Error('Missing phone code hash. Please request a new verification code.');
    }
    
    const requestData = {
      operation: 'connect',
      apiId: account.apiKey,
      apiHash: account.apiHash,
      phoneNumber: account.phoneNumber,
      verificationCode: code,
      phone_code_hash: phoneCodeHash,
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
      storeSession(account.id, data.session);
      logInfo(context, 'Updated session for account:', account.id);
      
      // Also store user data if available
      if (data.user) {
        localStorage.setItem(`telegram_user_${account.id}`, JSON.stringify(data.user));
        logInfo(context, 'Stored user data for account:', account.id);
      }
    }
    
    // Clear the phone code hash as it's no longer needed
    localStorage.removeItem(`telegram_code_hash_${account.id}`);
    
    logInfo(context, 'Verification successful');
    return true;
  } catch (error) {
    logError(context, 'Exception during verification:', error);
    throw error;
  }
};
