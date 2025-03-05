
import { ApiAccount } from "@/types/channels";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

/**
 * Validate Telegram API credentials without creating an account
 */
export const validateTelegramCredentials = async (account: ApiAccount): Promise<{
  success: boolean,
  error?: string
}> => {
  try {
    console.log(`=== VALIDATING TELEGRAM CREDENTIALS ===`);
    console.log(`Account: ${account.nickname} (${account.phoneNumber})`);
    console.log(`API ID: ${account.apiKey}`);
    
    // Check if the inputs match the expected formats before sending
    const apiId = parseInt(account.apiKey, 10);
    if (isNaN(apiId)) {
      console.error("Invalid API ID format:", account.apiKey);
      return { 
        success: false, 
        error: "API ID must be a valid integer. Please check your Telegram API credentials." 
      };
    }
    
    // Check API Hash format (usually 32 hex characters)
    if (!account.apiHash || account.apiHash.length !== 32 || !/^[a-f0-9]+$/i.test(account.apiHash)) {
      console.error("Invalid API Hash format:", account.apiHash);
      return { 
        success: false, 
        error: "API Hash appears to be invalid. It should be a 32-character hexadecimal string." 
      };
    }
    
    // Check phone number format
    if (!account.phoneNumber || !account.phoneNumber.startsWith('+')) {
      console.error("Invalid phone number format:", account.phoneNumber);
      return { 
        success: false, 
        error: "Phone number must be in international format starting with a + sign (e.g., +12345678901)." 
      };
    }
    
    // Try to make a connection to the Supabase function
    try {
      console.log("Checking Edge Function deployment status...");
      console.log("Calling Supabase function 'telegram-connector' for validation...");
      
      // Call the Supabase function to validate credentials without storing
      const { data, error } = await supabase.functions.invoke('telegram-connector', {
        body: {
          operation: 'validate',
          apiId: account.apiKey,
          apiHash: account.apiHash,
          phoneNumber: account.phoneNumber,
          accountId: 'temp-validation' // We don't have an account ID yet
        }
      });
      
      console.log("Telegram credentials validation response:", data);
      
      if (error) {
        console.error('Error validating Telegram credentials:', error);
        
        // More descriptive error handling for different error scenarios
        if (error.message) {
          if (error.message.includes('Failed to fetch')) {
            console.error("Network error when connecting to Edge Function");
            return { 
              success: false, 
              error: "Network error: Could not connect to the Edge Function. This could be because: 1) The Edge Function is not deployed yet, 2) There's an internet connectivity issue, or 3) The Edge Function has an error. Please check your Supabase Edge Functions dashboard." 
            };
          }
          
          if (error.message.includes('not found') || error.message.includes('404')) {
            console.error("Edge Function not found or not deployed");
            return { 
              success: false, 
              error: "Edge Function 'telegram-connector' not found. Please make sure the Edge Function is deployed correctly in your Supabase project." 
            };
          }
          
          if (error.message.includes('timed out')) {
            console.error("Edge Function execution timed out");
            return { 
              success: false, 
              error: "Edge Function execution timed out. This might indicate that the Telegram API is slow to respond or there's an issue with your credentials." 
            };
          }
        }
        
        return { success: false, error: error.message || "Unknown error from Edge Function" };
      }
      
      if (data?.error) {
        console.error('Error in Telegram validation:', data.error);
        
        // Check for known Telegram API errors
        if (data.error.includes('API_ID_INVALID')) {
          return { success: false, error: "Invalid API ID. Please check your Telegram API credentials." };
        }
        
        if (data.error.includes('API_HASH_INVALID')) {
          return { success: false, error: "Invalid API Hash. Please check your Telegram API credentials." };
        }
        
        if (data.error.includes('PHONE_NUMBER_INVALID')) {
          return { success: false, error: "Invalid phone number format. Please use international format with country code." };
        }
        
        if (data.error.includes('PHONE_NUMBER_BANNED')) {
          return { success: false, error: "This phone number has been banned from Telegram." };
        }
        
        if (data.error.includes('PHONE_CODE_INVALID') || data.error.includes('PHONE_CODE_EXPIRED')) {
          return { success: false, error: "Invalid or expired verification code." };
        }
        
        if (data.error.includes('VERSION_OUTDATED')) {
          return { success: false, error: "Telegram client version is outdated. Please check the Edge Function logs for details." };
        }
        
        return { success: false, error: data.error };
      }
      
      if (data?.success) {
        console.log("Telegram credentials validated successfully");
        return { success: true };
      }
      
      console.warn("Unexpected response from Telegram connector:", data);
      return { success: false, error: "Unknown error validating Telegram credentials" };
      
    } catch (fetchError) {
      console.error('Error making request to Telegram connector:', fetchError);
      // Handle specific network errors
      if (fetchError.message) {
        if (fetchError.message.includes('Failed to fetch')) {
          return { 
            success: false, 
            error: "Network error: Failed to connect to the Edge Function. Please verify that your Supabase project is properly configured and the function is deployed." 
          };
        }
        
        if (fetchError.message.includes('CORS')) {
          return { 
            success: false, 
            error: "CORS error: The Edge Function is not properly configured to allow requests from this domain." 
          };
        }
      }
      return { success: false, error: fetchError.message || "Failed to connect to validation service" };
    }
  } catch (error) {
    console.error('Exception validating Telegram credentials:', error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
};
