
import { supabase } from '@/integrations/supabase/client';
import { ApiAccount } from '@/types/channels';
import { logInfo, logError, trackApiCall } from './debugger';

/**
 * Verifies a Telegram account using the code received via SMS/Telegram
 */
export const verifyTelegramCode = async (
  account: ApiAccount,
  verificationCode: string,
  phoneCodeHash: string
) => {
  const context = 'TelegramVerifier';
  logInfo(context, `Verifying code for account: ${account.nickname}`);
  
  try {
    const requestData = {
      operation: 'verify',
      apiId: account.apiKey,
      apiHash: account.apiHash,
      phoneNumber: account.phoneNumber,
      accountId: account.id || 'unknown',
      verificationCode,
      phoneCodeHash
    };
    
    logInfo(context, 'Calling Supabase function \'telegram-connector\' for verification...');
    
    const { data, error } = await supabase.functions.invoke('telegram-connector', {
      body: requestData
    });
    
    // Track API call for debugging
    trackApiCall('telegram-connector/verify', requestData, data, error);
    
    if (error) {
      logError(context, 'Error verifying Telegram code:', error);
      throw new Error(error.message || 'Failed to verify code');
    }
    
    if (!data.success) {
      logError(context, 'Verification failed:', data.error);
      throw new Error(data.error || 'Failed to verify Telegram code');
    }
    
    logInfo(context, 'Verification successful:', data);
    
    return {
      success: true,
      sessionSaved: data.sessionSaved || false
    };
  } catch (error) {
    logError(context, 'Exception during verification:', error);
    throw error;
  }
};
