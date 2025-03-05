// This file would need to be created or updated with better validation logic
import { ApiAccount } from '@/types/channels';
import { supabase } from '@/integrations/supabase/client';
import { logInfo, logWarning, logError, trackApiCall } from './debugger';
import { runConnectivityChecks } from './networkCheck';

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
  
  try {
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
    
    const requestData = {
      operation: 'validate',
      apiId: account.apiKey,
      apiHash: account.apiHash,
      phoneNumber: account.phoneNumber,
      accountId: 'temp-validation' // Temporary ID for validation purposes
    };
    
    try {
      const { data, error } = await supabase.functions.invoke('telegram-connector', {
        body: requestData
      });
      
      // Track the API call with our enhanced debugger
      trackApiCall('telegram-connector/validate', requestData, data, error);
      
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
        
        return { 
          success: false, 
          error: error.message || 'Unknown error occurred during validation'
        };
      }
      
      if (!data.success) {
        return { 
          success: false, 
          error: data.error || 'Invalid Telegram API credentials' 
        };
      }
      
      return { success: true };
      
    } catch (invokeError) {
      // Enhanced error logging and handling
      logError(context, 'Exception during Telegram validation', invokeError);
      
      // Provide more specific error messages
      if (invokeError instanceof Error) {
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
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred during validation'
    };
  }
};
