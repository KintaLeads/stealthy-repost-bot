
import { ApiAccount } from '@/types/channels';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { ConnectionResult, ConnectionOptions } from './types';

/**
 * Handles the connection to Telegram.
 * This simplified version directly calls the edge function.
 */
export const connectToTelegram = async (
  account: ApiAccount,
  options: ConnectionOptions = {}
): Promise<ConnectionResult> => {
  try {
    console.log('Starting Telegram connection for account:', account.nickname || account.phoneNumber);
    
    // Validate API ID
    const apiId = parseInt(account.apiKey, 10);
    if (isNaN(apiId) || apiId <= 0) {
      throw new Error(`Invalid API ID: "${account.apiKey}" is not a valid number`);
    }
    
    // Construct payload
    const payload = {
      operation: 'connect', 
      apiId: apiId,
      apiHash: account.apiHash,
      phoneNumber: account.phoneNumber,
      accountId: account.id || 'unknown',
      testOnly: options.testOnly || false,
      debug: options.debug || false
    };
    
    // If we have a verification code and hash, add them to the payload
    if (options.verificationCode && options.phoneCodeHash) {
      Object.assign(payload, {
        verificationCode: options.verificationCode,
        phoneCodeHash: options.phoneCodeHash
      });
    }
    
    console.log('Sending request to Telegram connector with payload:', {
      ...payload,
      apiHash: '[REDACTED]'
    });
    
    // Call the edge function
    const { data, error } = await supabase.functions.invoke('telegram-connector', {
      body: payload
    });
    
    if (error) {
      console.error('Telegram connection error:', error);
      toast({
        title: "Connection Error",
        description: error.message || 'Failed to connect to Telegram',
        variant: "destructive",
      });
      
      return {
        success: false,
        error: error.message || 'Failed to connect to Telegram'
      };
    }
    
    console.log('Telegram connector response:', data);
    
    // If code verification is needed
    if (data.codeNeeded) {
      toast({
        title: "Verification Required",
        description: "Enter the verification code sent to your Telegram app",
      });
      
      // Store phoneCodeHash in localStorage for later use
      if (data.phoneCodeHash && account.id) {
        localStorage.setItem(`telegram_code_hash_${account.id}`, data.phoneCodeHash);
      }
      
      return {
        success: true,
        codeNeeded: true,
        phoneCodeHash: data.phoneCodeHash,
        needsVerification: true
      };
    }
    
    // If we have a session, store it
    if (data.session) {
      // Store session in localStorage
      localStorage.setItem(`telegram_session_${account.id}`, data.session);
      console.log(`Session stored for account ${account.id}`);
    }
    
    toast({
      title: "Connected Successfully",
      description: "Your Telegram account is now connected",
    });
    
    return {
      success: true,
      session: data.session,
      user: data.user
    };
  } catch (error) {
    console.error('Error in connectToTelegram:', error);
    
    toast({
      title: "Connection Error",
      description: error instanceof Error ? error.message : 'An unknown error occurred',
      variant: "destructive",
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
};
