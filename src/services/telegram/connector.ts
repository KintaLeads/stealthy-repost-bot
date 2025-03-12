
import { supabase } from '@/integrations/supabase/client';
import { ApiAccount } from '@/types/dashboard';
import { logInfo, logError, trackApiCall } from './debugger';
import { ConnectionResult } from './types';

/**
 * Validates API credentials before sending to the Edge Function
 */
const validateCredentials = (account: ApiAccount): string | null => {
  const context = 'CredentialValidator';
  
  // Debug log account details
  logInfo(context, '--- CREDENTIAL VALIDATION STARTED ---');
  logInfo(context, `Account ID: ${account.id || 'undefined'}`);
  logInfo(context, `Account Nickname: ${account.nickname || 'undefined'}`);
  logInfo(context, `API ID provided: ${account.apiKey ? 'Yes (' + account.apiKey + ')' : 'No'}`);
  logInfo(context, `API Hash provided: ${account.apiHash ? 'Yes (length: ' + account.apiHash.length + ')' : 'No'}`);
  logInfo(context, `Phone Number provided: ${account.phoneNumber ? 'Yes (' + account.phoneNumber + ')' : 'No'}`);
  
  // Check API ID
  if (!account.apiKey || account.apiKey.trim() === '') {
    logError(context, "API ID cannot be empty");
    return "API ID cannot be empty";
  }
  
  const apiIdNum = parseInt(account.apiKey, 10);
  if (isNaN(apiIdNum) || apiIdNum <= 0) {
    logError(context, `API ID must be a positive number, received: ${account.apiKey}`);
    return "API ID must be a positive number";
  }
  
  // Check API Hash
  if (!account.apiHash || account.apiHash.trim() === '') {
    logError(context, "API Hash cannot be empty");
    return "API Hash cannot be empty";
  }
  
  // Check phone number
  if (!account.phoneNumber || account.phoneNumber.trim() === '') {
    logError(context, "Phone number cannot be empty");
    return "Phone number cannot be empty";
  }
  
  logInfo(context, '--- CREDENTIAL VALIDATION PASSED ---');
  return null; // No validation errors
};

/**
 * Handles the initial connection attempt to Telegram API
 * This determines if verification is needed
 */
export const handleInitialConnection = async (account: ApiAccount): Promise<ConnectionResult> => {
  const context = 'TelegramConnector';
  logInfo(context, `=== INITIALIZING CONNECTION ===`);
  logInfo(context, `Account: ${account.nickname} (ID: ${account.id || 'unknown'})`);
  logInfo(context, `API ID: ${account.apiKey || 'missing'}`);
  logInfo(context, `API Hash: ${account.apiHash ? (account.apiHash.substring(0, 3) + '...') : 'missing'}`);
  logInfo(context, `Phone Number: ${account.phoneNumber || 'missing'}`);
  
  try {
    // Validate API credentials before sending to the Edge Function
    const validationError = validateCredentials(account);
    if (validationError) {
      logError(context, `Validation failed: ${validationError}`);
      return {
        success: false,
        codeNeeded: false,
        error: validationError
      };
    }
    
    // Double-check for missing credentials
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
    
    // Trim all input values to avoid whitespace issues
    const trimmedApiId = account.apiKey.trim();
    const trimmedApiHash = account.apiHash.trim();
    const trimmedPhoneNumber = account.phoneNumber.trim();
    
    logInfo(context, `After trimming - API ID: ${trimmedApiId}, API Hash: ${trimmedApiHash.substring(0, 3)}..., Phone: ${trimmedPhoneNumber}`);
    
    // Log the exact values we're sending for debugging
    logInfo(context, 'EXACT REQUEST VALUES:');
    logInfo(context, `apiId: "${trimmedApiId}" (${typeof trimmedApiId}, length: ${trimmedApiId.length})`);
    logInfo(context, `apiHash: "${trimmedApiHash.substring(0, 3)}..." (${typeof trimmedApiHash}, length: ${trimmedApiHash.length})`);
    logInfo(context, `phoneNumber: "${trimmedPhoneNumber}" (${typeof trimmedPhoneNumber}, length: ${trimmedPhoneNumber.length})`);
    logInfo(context, `accountId: "${account.id || 'unknown'}" (${typeof account.id})`);
    
    const requestData = {
      operation: 'connect',
      apiId: trimmedApiId,
      apiHash: trimmedApiHash,
      phoneNumber: trimmedPhoneNumber,
      accountId: account.id || 'unknown',
      debug: true // Always send debug flag to help with troubleshooting
    };
    
    logInfo(context, 'Calling Supabase function \'telegram-connector\' for connection...');
    
    try {
      // Try using the telegram-realtime function as a fallback
      // This is a temporary measure to help diagnose issues with the connector
      logInfo(context, 'Attempting to use telegram-realtime function as a fallback...');
      
      const realtimeResponse = await supabase.functions.invoke('telegram-realtime', {
        body: requestData
      });
      
      trackApiCall('telegram-realtime/connect', requestData, realtimeResponse.data, realtimeResponse.error);
      
      if (realtimeResponse.error) {
        logError(context, 'Error from realtime function:', realtimeResponse.error);
        return {
          success: false,
          codeNeeded: false,
          error: `Realtime function error: ${realtimeResponse.error.message || 'Unknown error'}`,
          details: realtimeResponse.error
        };
      }
      
      if (realtimeResponse.data && realtimeResponse.data.success) {
        logInfo(context, 'Successfully connected using realtime function');
        return {
          success: true,
          codeNeeded: false,
          error: undefined,
          details: { usedFallback: true, function: 'telegram-realtime' }
        };
      }
      
      // If realtime function doesn't work, try the original connector
      logInfo(context, 'Fallback didn\'t work, trying original connector...');
      
      // Make request to the Edge Function with more detailed error handling
      const { data, error } = await supabase.functions.invoke('telegram-connector', {
        body: requestData
      });
      
      // Track API call for debugging
      trackApiCall('telegram-connector/connect', requestData, data, error);
      
      if (error) {
        // Enhanced error handling with more details
        logError(context, 'Error connecting to Telegram:', error);
        return {
          success: false,
          codeNeeded: false,
          error: `Edge Function error: ${error.message || 'Unknown error'} (${error.name || 'No error name'})`,
          details: error
        };
      }
      
      if (!data || !data.success) {
        // Capture detailed error information from the function
        const errorMsg = data?.error || 'Failed to connect to Telegram API';
        const errorDetails = data?.details || null;
        
        // Fix: correct argument count for logError
        logError(context, `Connection request failed: ${errorMsg} ${errorDetails ? JSON.stringify(errorDetails) : ''}`);
        
        return {
          success: false,
          codeNeeded: false,
          error: errorMsg,
          details: errorDetails
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
    } catch (requestError) {
      // Handle network or unexpected errors
      logError(context, 'Exception during API request:', requestError);
      
      return {
        success: false,
        codeNeeded: false,
        error: requestError instanceof Error 
          ? `Request error: ${requestError.message}`
          : 'Failed to make request to Edge Function',
        details: requestError
      };
    }
  } catch (error) {
    logError(context, 'Exception during connection attempt:', error);
    
    return {
      success: false,
      codeNeeded: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
      details: error
    };
  }
};

// Export connectToTelegram as an alias for handleInitialConnection
export const connectToTelegram = handleInitialConnection;
