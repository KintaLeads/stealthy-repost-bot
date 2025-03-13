
import { supabase } from '@/integrations/supabase/client';
import { ApiAccount, ChannelPair } from '@/types/channels';
import { Message } from '@/types/dashboard';
import { toast } from 'sonner';
import { logInfo, logError } from './debugger';
import { connectToTelegram } from './connector';

// Extract the project ID for Supabase
const SUPABASE_PROJECT_ID = 'eswfrzdqxsaizkdswxfn';

/**
 * Sets up a realtime listener for Telegram messages
 */
export const setupRealtimeListener = async (
  account: ApiAccount,
  channelPairs: ChannelPair[],
  onNewMessages: (messages: Message[]) => void
) => {
  const context = 'RealtimeService';
  
  try {
    logInfo(context, '🚀 Setting up realtime listener for account:', {
      accountId: account.id,
      nickname: account.nickname,
      phoneNumber: account.phoneNumber
    });
    
    logInfo(context, `Channel pairs configured: ${channelPairs.length}`);
    
    // Extract source channels for listening
    const sourceChannels = channelPairs
      .filter(pair => pair.sourceChannel && pair.sourceChannel.trim() !== '')
      .map(pair => pair.sourceChannel);
      
    if (sourceChannels.length === 0) {
      throw new Error('No source channels configured');
    }
    
    logInfo(context, `Listening to ${sourceChannels.length} channels:`, sourceChannels);
    
    // Use hardcoded project ID instead of importing from config
    logInfo(context, `Using Supabase project ID: ${SUPABASE_PROJECT_ID}`);
    
    // First, ensure we're authenticated with Telegram
    logInfo(context, 'Ensuring Telegram connection before setting up listener');
    
    const connectionResult = await connectToTelegram(account);
    
    if (!connectionResult.success) {
      if (connectionResult.codeNeeded) {
        // The user needs to enter a verification code
        logInfo(context, 'Verification code needed - redirecting to verification flow');
        
        // Store the phone code hash for later use
        if (connectionResult.phoneCodeHash) {
          localStorage.setItem(`telegram_code_hash_${account.id}`, connectionResult.phoneCodeHash);
        }
        
        toast.info('Please verify your Telegram account with the code sent to your device');
        
        // Return a special object indicating verification is needed
        return {
          id: 'verification_needed',
          needsVerification: true,
          phoneCodeHash: connectionResult.phoneCodeHash,
          stop: () => Promise.resolve(true)
        };
      }
      
      throw new Error(`Failed to connect to Telegram: ${connectionResult.error}`);
    }
    
    // Prepare the listener payload
    const listenerPayload = {
      operation: 'listen',
      apiId: account.apiKey,
      apiHash: account.apiHash,
      phoneNumber: account.phoneNumber,
      accountId: account.id,
      sourceChannels: sourceChannels, // Use sourceChannels instead of channelNames to match edge function
      debug: true
    };
    
    logInfo(context, 'Calling telegram-realtime edge function with payload:', {
      ...listenerPayload,
      apiHash: '[REDACTED]'
    });
    
    console.log('Before calling edge function - full payload:', {
      ...listenerPayload,
      apiHash: '[REDACTED FOR SECURITY]'
    });
    
    // Make direct call to edge function with proper headers
    const { data, error } = await supabase.functions.invoke('telegram-realtime', {
      body: listenerPayload,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Edge function response:', { data, error });
    
    if (error) {
      logError(context, 'Edge function error:', error);
      throw new Error(`Edge function error: ${error.message || error}`);
    }
    
    if (!data) {
      logError(context, 'No data returned from edge function');
      throw new Error('No data returned from edge function');
    }
    
    logInfo(context, 'Edge function response:', data);
    
    // Create an id for the listener
    const listenerId = `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create a stop function to clean up the listener
    const stopListener = async () => {
      logInfo(context, `Stopping listener ${listenerId}`);
      
      try {
        const { data, error } = await supabase.functions.invoke('telegram-realtime', {
          body: {
            operation: 'stop',
            accountId: account.id,
            listenerId
          }
        });
        
        if (error) {
          logError(context, 'Error stopping listener:', error);
          return false;
        }
        
        logInfo(context, 'Listener stopped successfully');
        return true;
      } catch (stopError) {
        logError(context, 'Exception stopping listener:', stopError);
        return false;
      }
    };
    
    // Return the listener interface
    return {
      id: listenerId,
      stop: stopListener
    };
    
  } catch (error) {
    logError(context, 'Failed to setup realtime listener:', error);
    console.error('Full error details:', error);
    
    toast.error(`Failed to setup listener: ${error instanceof Error ? error.message : String(error)}`);
    
    throw error;
  }
};

/**
 * Disconnects a realtime listener for an account
 */
export const disconnectRealtime = async (accountId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('telegram-realtime', {
      body: {
        operation: 'stop',
        accountId
      }
    });
    
    if (error) {
      console.error('Error disconnecting realtime listener:', error);
      return false;
    }
    
    return data?.success === true;
  } catch (error) {
    console.error('Exception disconnecting realtime listener:', error);
    return false;
  }
};

/**
 * Checks if there's an active realtime listener for an account
 */
export const checkRealtimeStatus = async (accountId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('telegram-realtime', {
      body: {
        operation: 'status',
        accountId
      }
    });
    
    if (error) {
      console.error('Error checking realtime status:', error);
      return false;
    }
    
    return data?.connected === true;
  } catch (error) {
    console.error('Exception checking realtime status:', error);
    return false;
  }
};
