
import { supabase } from '@/integrations/supabase/client';
import { ApiAccount, ChannelPair } from '@/types/channels';
import { Message } from '@/types/dashboard';
import { toast } from 'sonner';
import { logInfo, logError } from './debugger';

// Get the Supabase project ID from the config file
import config from '../../../supabase/config.toml';

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
    
    // Get the project ID from the config
    const projectId = config.project_id || 'eswfrzdqxsaizkdswxfn';
    logInfo(context, `Using Supabase project ID: ${projectId}`);
    
    // Prepare the listener payload
    const listenerPayload = {
      operation: 'listen',
      apiId: account.apiKey,
      apiHash: account.apiHash,
      phoneNumber: account.phoneNumber,
      accountId: account.id,
      sourceChannels,
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
    
    // Make direct call to edge function
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
