
import { ApiAccount } from "@/types/channels";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { getStoredSession, storeSession } from "./sessionManager";

/**
 * Connect to Telegram API using the provided account credentials
 */
export const connectToTelegram = async (account: ApiAccount): Promise<{
  success: boolean, 
  codeNeeded?: boolean, 
  phoneCodeHash?: string,
  error?: string
}> => {
  try {
    console.log(`=== CONNECTING TO TELEGRAM ===`);
    console.log(`Account: ${account.nickname} (${account.phoneNumber})`);
    console.log(`API ID: ${account.apiKey}`);
    console.log(`Account ID: ${account.id}`);
    
    // Check if we have a stored session for this account
    const sessionString = getStoredSession(account.id);
    
    // Prepare the headers
    const headers: Record<string, string> = {};
    if (sessionString) {
      headers['X-Telegram-Session'] = sessionString;
      console.log(`Found stored session for account: ${account.nickname}, using it`);
      console.log(`Session string length: ${sessionString.length}`);
    } else {
      console.log(`No stored session found for account: ${account.nickname}, will need to authenticate`);
    }
    
    console.log(`Checking Edge Function status...`);
    console.log(`Calling Supabase function 'telegram-connector'...`);
    
    // Call the Supabase function
    const { data, error } = await supabase.functions.invoke('telegram-connector', {
      body: {
        operation: 'connect',
        apiId: account.apiKey,
        apiHash: account.apiHash,
        phoneNumber: account.phoneNumber,
        accountId: account.id
      },
      headers
    });
    
    console.log("Telegram connector response:", data);
    
    if (error) {
      console.error('Error connecting to Telegram:', error);
      
      // Enhanced error handling for different error scenarios
      if (error.message) {
        if (error.message.includes('Failed to fetch')) {
          toast({
            title: "Connection Failed",
            description: "Network error: Could not connect to the Edge Function. Please check if the function is deployed.",
            variant: "destructive",
          });
          return { 
            success: false, 
            error: "Network error: Could not connect to the Edge Function. Please check if the function is deployed." 
          };
        }
        
        if (error.message.includes('not found') || error.message.includes('404')) {
          toast({
            title: "Connection Failed",
            description: "Edge Function 'telegram-connector' not found. Please check your Supabase project.",
            variant: "destructive",
          });
          return { 
            success: false, 
            error: "Edge Function 'telegram-connector' not found. Please check your Supabase project." 
          };
        }
        
        if (error.message.includes('timed out')) {
          toast({
            title: "Connection Failed",
            description: "Edge Function execution timed out. This might indicate slow API response.",
            variant: "destructive",
          });
          return { 
            success: false, 
            error: "Edge Function execution timed out. This might indicate slow API response." 
          };
        }
      }
      
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
    
    if (data?.error) {
      console.error('Error in Telegram connector:', data.error);
      
      // Check for known Telegram API errors
      let errorMessage = data.error;
      if (data.error.includes('API_ID_INVALID') || data.error.includes('API_HASH_INVALID')) {
        errorMessage = "Invalid API credentials. Please check your Telegram API ID and Hash.";
      } else if (data.error.includes('PHONE_NUMBER_INVALID')) {
        errorMessage = "Invalid phone number format. Please use international format with country code.";
      } else if (data.error.includes('PHONE_NUMBER_BANNED')) {
        errorMessage = "This phone number has been banned from Telegram.";
      } else if (data.error.includes('AUTH_KEY_UNREGISTERED')) {
        errorMessage = "Authentication failed. The provided session is no longer valid.";
      } else if (data.error.includes('VERSION_OUTDATED')) {
        errorMessage = "Telegram client version is outdated. Please check the Edge Function logs.";
      } else if (data.error.includes('FLOOD_WAIT')) {
        // Extract wait time if available
        const waitMatch = data.error.match(/FLOOD_WAIT_(\d+)/);
        const waitTime = waitMatch ? parseInt(waitMatch[1], 10) : null;
        errorMessage = waitTime 
          ? `Too many requests. Please wait ${waitTime} seconds before trying again.` 
          : "Too many requests. Please wait before trying again.";
      }
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
    
    // Check if code verification is needed
    if (data?.codeNeeded) {
      console.log("Verification code needed for account:", account.nickname, "phoneCodeHash:", data.phoneCodeHash);
      toast({
        title: "Verification Required",
        description: "Please enter the verification code sent to your phone",
      });
      return { 
        success: true, 
        codeNeeded: true, 
        phoneCodeHash: data.phoneCodeHash 
      };
    }
    
    if (data?.success && data?.sessionString) {
      // Store the session for this account
      console.log("Successfully connected with account:", account.nickname);
      console.log("Session string length:", data.sessionString.length);
      storeSession(account.id, data.sessionString);
      toast({
        title: "Connected",
        description: "Successfully connected to Telegram API",
      });
      return { success: true };
    }
    
    console.warn("Unexpected response from Telegram connector:", data);
    toast({
      title: "Connection Failed",
      description: "Received unexpected response from Telegram connector",
      variant: "destructive",
    });
    return { success: false, error: "Unknown error connecting to Telegram" };
  } catch (error) {
    console.error('Exception connecting to Telegram:', error);
    toast({
      title: "Connection Failed",
      description: error instanceof Error ? error.message : "An unknown error occurred",
      variant: "destructive",
    });
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
};
