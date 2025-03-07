
import { supabase } from '@/integrations/supabase/client';
import { ApiAccount } from '@/types/channels';
import { logInfo, logError, trackApiCall } from './debugger';

/**
 * Handles the initial connection attempt to Telegram API
 * This determines if verification is needed
 */
export const handleInitialConnection = async (account: ApiAccount) => {
  const context = 'TelegramConnector';
  logInfo(context, `Initializing connection for account: ${account.nickname}`);
  
  try {
    const requestData = {
      operation: 'connect',
      apiId: account.apiKey,
      apiHash: account.apiHash,
      phoneNumber: account.phoneNumber,
      accountId: account.id || 'unknown'
    };
    
    logInfo(context, 'Calling Supabase function \'telegram-connector\' for connection...');
    
    const { data, error } = await supabase.functions.invoke('telegram-connector', {
      body: requestData
    });
    
    // Track API call for debugging
    trackApiCall('telegram-connector/connect', requestData, data, error);
    
    if (error) {
      logError(context, 'Error connecting to Telegram:', error);
      throw new Error(error.message || 'Failed to connect to Telegram');
    }
    
    if (!data.success) {
      logError(context, 'Connection request failed:', data.error);
      throw new Error(data.error || 'Failed to connect to Telegram API');
    }
    
    logInfo(context, 'Connection response:', data);
    
    return {
      codeNeeded: data.codeNeeded || false,
      phoneCodeHash: data.phoneCodeHash,
      success: data.success,
      error: data.error
    };
  } catch (error) {
    logError(context, 'Exception during connection attempt:', error);
    throw error;
  }
};

// Export connectToTelegram as an alias for handleInitialConnection
export const connectToTelegram = handleInitialConnection;
