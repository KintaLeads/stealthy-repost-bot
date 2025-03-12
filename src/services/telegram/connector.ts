
import { supabase } from '@/integrations/supabase/client';
import { ApiAccount } from '@/types/channels';
import { logInfo, logError, trackApiCall } from './debugger';
import { ConnectionResult } from './types';

/**
 * Validates API credentials before sending to the Edge Function
 */
const validateCredentials = (account: ApiAccount): string | null => {
  // Check API ID
  if (!account.apiKey || account.apiKey.trim() === '') {
    return "API ID cannot be empty";
  }
  
  const apiIdNum = parseInt(account.apiKey, 10);
  if (isNaN(apiIdNum) || apiIdNum <= 0) {
    return "API ID must be a positive number";
  }
  
  // Check API Hash
  if (!account.apiHash || account.apiHash.trim() === '') {
    return "API Hash cannot be empty";
  }
  
  // Check phone number
  if (!account.phoneNumber || account.phoneNumber.trim() === '') {
    return "Phone number cannot be empty";
  }
  
  return null; // No validation errors
};

/**
 * Handles the initial connection attempt to Telegram API
 * This determines if verification is needed
 */
export const handleInitialConnection = async (account: ApiAccount): Promise<ConnectionResult> => {
  const context = 'TelegramConnector';
  logInfo(context, `Initializing connection for account: ${account.nickname}`);
  
  try {
    // Validate API credentials before sending to the Edge Function
    const validationError = validateCredentials(account);
    if (validationError) {
      logError(context, validationError);
      return {
        success: false,
        codeNeeded: false,
        error: validationError
      };
    }
    
    // Original validation that checks for missing credentials
    if (!account.apiKey || !account.apiHash || !account.phoneNumber) {
      const missingCredentials = [];
      if (!account.apiKey) missingCredentials.push('API ID');
      if (!account.apiHash) missingCredentials.push('API Hash');
      if (!account.phoneNumber) missingCredentials.push('Phone Number');
      
      const errorMessage = `Missing required credentials: ${missingCredentials.join(', ')}`;
      logError(context, errorMessage);
      
      return {
        success: false,
        codeNeeded: false,
        error: errorMessage
      };
    }
    
    const requestData = {
      operation: 'connect',
      apiId: account.apiKey.trim(),
      apiHash: account.apiHash.trim(),
      phoneNumber: account.phoneNumber.trim(),
      accountId: account.id || 'unknown',
      debug: true // Always send debug flag to help with troubleshooting
    };
    
    logInfo(context, 'Calling Supabase function \'telegram-connector\' for connection...');
    logInfo(context, 'Request data:', {
      apiIdProvided: !!account.apiKey,
      apiHashProvided: !!account.apiHash,
      phoneNumberProvided: !!account.phoneNumber,
      accountIdProvided: !!account.id
    });
    
    const { data, error } = await supabase.functions.invoke('telegram-connector', {
      body: requestData
    });
    
    // Track API call for debugging
    trackApiCall('telegram-connector/connect', requestData, data, error);
    
    if (error) {
      logError(context, 'Error connecting to Telegram:', error);
      throw new Error(error.message || 'Failed to connect to Telegram');
    }
    
    if (!data || !data.success) {
      logError(context, 'Connection request failed:', data?.error || 'Unknown error');
      
      return {
        success: false,
        codeNeeded: false,
        error: data?.error || 'Failed to connect to Telegram API'
      };
    }
    
    logInfo(context, 'Connection response:', data);
    
    return {
      codeNeeded: data.codeNeeded || false,
      phoneCodeHash: data.phoneCodeHash,
      success: data.success,
      error: data.error,
      _testCode: data._testCode // Include the test code if present
    };
  } catch (error) {
    logError(context, 'Exception during connection attempt:', error);
    
    return {
      success: false,
      codeNeeded: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
};

// Export connectToTelegram as an alias for handleInitialConnection
export const connectToTelegram = handleInitialConnection;
