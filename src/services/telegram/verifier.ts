
import { ApiAccount } from '@/types/channels';
import { supabase } from '@/integrations/supabase/client';
import { logInfo, logError, trackApiCall } from './debugger';

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
    const requestData = {
      operation: 'verify',
      apiId: account.apiKey,
      apiHash: account.apiHash,
      phoneNumber: account.phoneNumber,
      verificationCode: code,
      accountId: account.id || 'unknown',
      ...options
    };
    
    logInfo(context, 'Calling Supabase function \'telegram-connector\' for verification...');
    
    const { data, error } = await supabase.functions.invoke('telegram-connector', {
      body: requestData
    });
    
    // Track API call for debugging
    trackApiCall('telegram-connector/verify', requestData, data, error);
    
    if (error) {
      logError(context, 'Error verifying Telegram code:', error);
      throw new Error(error.message || 'Failed to verify Telegram code');
    }
    
    if (!data.success) {
      logError(context, 'Verification failed:', data.error);
      throw new Error(data.error || 'Invalid verification code');
    }
    
    logInfo(context, 'Verification successful');
    return true;
  } catch (error) {
    logError(context, 'Exception during verification:', error);
    throw error;
  }
};
