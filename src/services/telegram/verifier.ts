
import { ApiAccount } from "@/types/channels";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { getStoredSession, storeSession } from "./sessionManager";

/**
 * Verify the Telegram code sent to the user's phone
 */
export const verifyTelegramCode = async (account: ApiAccount, code: string): Promise<boolean> => {
  try {
    console.log(`=== VERIFYING TELEGRAM CODE ===`);
    console.log(`Account: ${account.nickname} (${account.phoneNumber})`);
    console.log(`Code: ${code}`);
    
    const { data, error } = await supabase.functions.invoke('telegram-connector', {
      body: {
        operation: 'connect',
        apiId: account.apiKey,
        apiHash: account.apiHash,
        phoneNumber: account.phoneNumber,
        accountId: account.id,
        verificationCode: code
      }
    });
    
    console.log("Verification response:", data);
    
    if (error) {
      console.error('Error verifying code:', error);
      
      // Enhanced error handling
      let errorMessage = error.message;
      if (error.message && error.message.includes('Failed to fetch')) {
        errorMessage = "Network error: Could not connect to the Edge Function. Please check if the function is deployed.";
      }
      
      toast({
        title: "Verification Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
    
    if (data?.error) {
      console.error('Error in Telegram verification:', data.error);
      
      // Check for known Telegram API errors
      let errorMessage = data.error;
      if (data.error.includes('PHONE_CODE_INVALID')) {
        errorMessage = "Invalid verification code. Please check and try again.";
      } else if (data.error.includes('PHONE_CODE_EXPIRED')) {
        errorMessage = "Verification code has expired. Please request a new code.";
      } else if (data.error.includes('SESSION_PASSWORD_NEEDED')) {
        errorMessage = "Two-factor authentication is enabled. Please use another authentication method.";
      }
      
      toast({
        title: "Verification Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
    
    if (data?.success && data?.sessionString) {
      // Store the session for this account
      console.log("Successfully verified and authenticated with account:", account.nickname);
      console.log("Session string length:", data.sessionString.length);
      storeSession(account.id, data.sessionString);
      toast({
        title: "Verified",
        description: "Successfully authenticated with Telegram",
      });
      return true;
    }
    
    console.warn("Unexpected response from Telegram verification:", data);
    toast({
      title: "Verification Failed",
      description: "Received unexpected response from Telegram connector",
      variant: "destructive",
    });
    return false;
  } catch (error) {
    console.error('Exception verifying Telegram code:', error);
    toast({
      title: "Verification Failed",
      description: error instanceof Error ? error.message : "An unknown error occurred",
      variant: "destructive",
    });
    return false;
  }
};
