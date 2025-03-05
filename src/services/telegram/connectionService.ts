
import { ApiAccount } from "@/types/channels";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { getStoredSession, storeSession } from "./sessionManager";

/**
 * Connect to Telegram API using the provided account credentials
 */
export const connectToTelegram = async (account: ApiAccount): Promise<{success: boolean, codeNeeded?: boolean, phoneCodeHash?: string}> => {
  try {
    // Check if we have a stored session for this account
    const sessionString = getStoredSession(account.id);
    
    // Prepare the headers
    const headers: Record<string, string> = {};
    if (sessionString) {
      headers['X-Telegram-Session'] = sessionString;
    }
    
    console.log(`Connecting to Telegram with account: ${account.nickname}`);
    
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
    
    if (error) {
      console.error('Error connecting to Telegram:', error);
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
      return { success: false };
    }
    
    if (data.error) {
      console.error('Error in Telegram connector:', data.error);
      toast({
        title: "Connection Failed",
        description: data.error,
        variant: "destructive",
      });
      return { success: false };
    }
    
    // Check if code verification is needed
    if (data.codeNeeded) {
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
    
    if (data.success && data.sessionString) {
      // Store the session for this account
      storeSession(account.id, data.sessionString);
      toast({
        title: "Connected",
        description: "Successfully connected to Telegram API",
      });
      return { success: true };
    }
    
    return { success: false };
  } catch (error) {
    console.error('Exception connecting to Telegram:', error);
    toast({
      title: "Connection Failed",
      description: error.message || "An unknown error occurred",
      variant: "destructive",
    });
    return { success: false };
  }
};

/**
 * Verify the Telegram code sent to the user's phone
 */
export const verifyTelegramCode = async (account: ApiAccount, code: string): Promise<boolean> => {
  try {
    console.log(`Verifying code for account: ${account.nickname}`);
    
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
    
    if (error) {
      console.error('Error verifying code:', error);
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
    
    if (data.error) {
      console.error('Error in Telegram verification:', data.error);
      toast({
        title: "Verification Failed",
        description: data.error,
        variant: "destructive",
      });
      return false;
    }
    
    if (data.success && data.sessionString) {
      // Store the session for this account
      storeSession(account.id, data.sessionString);
      toast({
        title: "Verified",
        description: "Successfully authenticated with Telegram",
      });
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Exception verifying Telegram code:', error);
    toast({
      title: "Verification Failed",
      description: error.message || "An unknown error occurred",
      variant: "destructive",
    });
    return false;
  }
};
