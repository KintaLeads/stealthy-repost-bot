
// This file would need to be created or updated with better validation logic
import { ApiAccount } from '@/types/channels';
import { supabase } from '@/integrations/supabase/client';
import { logInfo, logWarning, logError, trackApiCall, trackApiCredentials } from './debugger';
import { runConnectivityChecks } from './networkCheck';

/**
 * Validate format of Telegram API credentials
 */
const validateCredentialFormat = (account: ApiAccount): { valid: boolean; error?: string } => {
  // Track API credentials at validation start
  trackApiCredentials(
    'credentialValidator.ts',
    'validateCredentialFormat',
    'start',
    account.apiKey,
    account.apiHash
  );
  
  // Check API ID format
  if (!account.apiKey || account.apiKey.trim() === '') {
    return { valid: false, error: "API ID cannot be empty" };
  }
  
  const apiId = parseInt(account.apiKey, 10);
  if (isNaN(apiId) || apiId <= 0) {
    return { valid: false, error: "API ID must be a positive number" };
  }
  
  // Check API Hash format (should be at least 32 characters for Telegram)
  if (!account.apiHash || account.apiHash.trim() === '') {
    return { valid: false, error: "API Hash cannot be empty" };
  }
  
  if (account.apiHash.length < 5) {
    return { valid: false, error: "API Hash appears to be too short" };
  }
  
  // Check phone number format (should include country code with +)
  if (!account.phoneNumber || account.phoneNumber.trim() === '') {
    return { valid: false, error: "Phone number cannot be empty" };
  }
  
  if (!/^\+[0-9]{7,15}$/.test(account.phoneNumber)) {
    return { valid: false, error: "Invalid phone number format. Must include country code (e.g. +1234567890)" };
  }
  
  // Track API credentials after validation
  trackApiCredentials(
    'credentialValidator.ts',
    'validateCredentialFormat',
    'validated',
    apiId, // Track as number here
    account.apiHash
  );
  
  return { valid: true };
}

/**
 * Validates Telegram API credentials by attempting a connection
 * @param account The API account to validate
 * @returns Object containing success status and optional error message
 */
export const validateTelegramCredentials = async (account: ApiAccount) => {
  const context = 'TelegramValidation';
  logInfo(context, '=== VALIDATING TELEGRAM CREDENTIALS ===');
  logInfo(context, `Account: ${account.nickname} (${account.phoneNumber})`);
  logInfo(context, `API ID: ${account.apiKey}`);
  
  // Track API credentials at start of validation
  trackApiCredentials(
    'credentialValidator.ts',
    'validateTelegramCredentials',
    'start',
    account.apiKey,
    account.apiHash,
    { phoneNumber: account.phoneNumber, accountId: account.id }
  );
  
  try {
    // First validate format of credentials before making any network requests
    const formatValidation = validateCredentialFormat(account);
    if (!formatValidation.valid) {
      logError(context, `Validation failed: ${formatValidation.error}`);
      return { 
        success: false, 
        error: formatValidation.error
      };
    }
    
    // Convert API ID to number for subsequent operations
    const numericApiId = parseInt(account.apiKey, 10);
    
    // First check if the edge function is deployed and accessible
    logInfo(context, 'Checking Edge Function deployment status...');
    const projectId = 'eswfrzdqxsaizkdswxfn'; // This should be configurable
    const connectivityResults = await runConnectivityChecks(projectId);
    
    if (!connectivityResults.supabase) {
      logError(context, 'Cannot connect to Supabase', connectivityResults);
      return { 
        success: false, 
        error: 'Cannot connect to Supabase. Please check your internet connection and try again.'
      };
    }
    
    if (!connectivityResults.telegram) {
      logError(context, 'Cannot connect to Telegram services', connectivityResults);
      return { 
        success: false, 
        error: 'Cannot connect to Telegram services. This might be due to network restrictions or Telegram API changes.'
      };
    }
    
    if (!connectivityResults.edgeFunction.deployed) {
      logError(context, 'Edge Function not deployed or inaccessible', connectivityResults.edgeFunction);
      return { 
        success: false, 
        error: `Edge Function issue: ${connectivityResults.edgeFunction.error || 'Not deployed or inaccessible'}`
      };
    }
    
    // If all connectivity checks pass, call the Edge Function
    logInfo(context, 'Calling Supabase function \'telegram-connector\' for validation...');
    
    // Trim whitespace from all fields
    const requestData = {
      operation: 'validate',
      apiId: numericApiId, // Send as numeric value
      apiHash: account.apiHash.trim(),
      phoneNumber: account.phoneNumber.trim(),
      accountId: account.id || 'temp-validation',
      // CRITICAL: Make sure we are explicitly requesting version 2.26.22
      telegramVersion: '2.26.22'
    };
    
    // Track API credentials before API call
    trackApiCredentials(
      'credentialValidator.ts',
      'validateTelegramCredentials',
      'before-api-call',
      requestData.apiId,
      requestData.apiHash,
      { operation: requestData.operation }
    );
    
    try {
      const { data, error } = await supabase.functions.invoke('telegram-connector', {
        body: requestData
      });
      
      // Track the API call with our enhanced debugger
      trackApiCall('telegram-connector/validate', requestData, data, error);
      
      // Track API credentials after API call
      trackApiCredentials(
        'credentialValidator.ts',
        'validateTelegramCredentials',
        'after-api-call',
        requestData.apiId,
        requestData.apiHash,
        { success: !error, error: error?.message }
      );
      
      // Log the validation response
      logInfo(context, 'Telegram credentials validation response:', data);
      
      if (error) {
        logError(context, 'Error validating Telegram credentials', error);
        
        // Provide more specific error messages based on error type
        if (error.message?.includes('Failed to fetch') || error.name === 'FetchError') {
          return { 
            success: false, 
            error: 'Network error: Unable to reach the validation service. This could be due to network connectivity issues or CORS restrictions.'
          };
        }
        
        // Check for version mismatch
        if (error.message?.includes('unsupported Telegram client version')) {
          return {
            success: false,
            error: 'Unsupported Telegram client version. Please update to version 2.26.22.'
          };
        }
        
        return { 
          success: false, 
          error: error.message || 'Unknown error occurred during validation'
        };
      }
      
      if (!data || !data.success) {
        const errorMessage = data?.error || 'Invalid Telegram API credentials';
        
        // Check for version mismatch in the response
        if (errorMessage.includes('unsupported Telegram client version')) {
          return {
            success: false,
            error: 'Unsupported Telegram client version. Please update to version 2.26.22.'
          };
        }
        
        return { 
          success: false, 
          error: errorMessage
        };
      }
      
      return { success: true };
      
    } catch (invokeError) {
      // Enhanced error logging and handling
      logError(context, 'Exception during Telegram validation', invokeError);
      
      // Track API credentials on error
      trackApiCredentials(
        'credentialValidator.ts',
        'validateTelegramCredentials',
        'invoke-error',
        account.apiKey,
        account.apiHash,
        { error: invokeError instanceof Error ? invokeError.message : String(invokeError) }
      );
      
      // Provide more specific error messages
      if (invokeError instanceof Error) {
        // Check for version mismatch
        if (invokeError.message.includes('unsupported Telegram client version')) {
          return {
            success: false,
            error: 'Unsupported Telegram client version. Please update to version 2.26.22.'
          };
        }
        
        if (invokeError.message.includes('Failed to fetch')) {
          return { 
            success: false, 
            error: 'Network error: Unable to reach the validation service. Check your internet connection and ensure the Edge Function is deployed.' 
          };
        }
        
        if (invokeError.name === 'TypeError' && invokeError.message.includes('NetworkError')) {
          return { 
            success: false, 
            error: 'Network error: Cross-Origin Request Blocked. This may be a CORS issue with the Edge Function.' 
          };
        }
        
        if (invokeError.message.includes('maskApiHash is not a function')) {
          return { 
            success: false, 
            error: 'Internal validation error: Function \'maskApiHash\' is not defined. Please contact support.' 
          };
        }
        
        return { 
          success: false, 
          error: `Error: ${invokeError.name} - ${invokeError.message}` 
        };
      }
      
      return { 
        success: false, 
        error: 'Unknown error occurred during validation' 
      };
    }
  } catch (error) {
    logError(context, 'Unexpected error during validation process', error);
    
    // Track API credentials on error
    trackApiCredentials(
      'credentialValidator.ts',
      'validateTelegramCredentials',
      'unhandled-error',
      account.apiKey,
      account.apiHash,
      { error: error instanceof Error ? error.message : String(error) }
    );
    
    // Check for version mismatch
    if (error instanceof Error && error.message.includes('unsupported Telegram client version')) {
      return {
        success: false,
        error: 'Unsupported Telegram client version. Please update to version 2.26.22.'
      };
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred during validation'
    };
  }
};
