
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ApiAccount, ChannelPair, MetricsData } from '@/types/channels';
import { Message } from '@/types/dashboard';

// Maintain a reference to active listeners
const activeListeners = new Map<string, { stop: () => Promise<boolean>, id: string }>();

/**
 * Checks the status of a realtime listener for a given account
 */
export async function checkRealtimeStatus(accountId: string): Promise<boolean> {
  console.log('Checking realtime status for account:', accountId);
  
  try {
    // Check if we have an active listener in memory
    if (activeListeners.has(accountId)) {
      console.log('Active listener found in memory');
      return true;
    }
    
    // If we don't have an active listener in memory, check with the edge function
    const { data, error } = await supabase.functions.invoke(
      'telegram-realtime',
      {
        body: {
          operation: 'status',
          accountId
        }
      }
    );
    
    if (error) {
      console.error('Status check failed:', error);
      throw error;
    }
    
    console.log('Status check response:', data);
    return data?.connected || false;
  } catch (error) {
    console.error('Error checking realtime status:', error);
    return false;
  }
}

/**
 * Disconnect an active realtime listener
 */
export async function disconnectRealtime(accountId: string): Promise<boolean> {
  console.log('Disconnecting realtime listener for account:', accountId);
  
  try {
    // First attempt to stop the listener we have in memory
    if (activeListeners.has(accountId)) {
      const listener = activeListeners.get(accountId);
      if (listener?.stop) {
        console.log('Stopping listener from memory');
        await listener.stop();
        activeListeners.delete(accountId);
      }
    }
    
    // Also notify the edge function to stop listening
    const { data, error } = await supabase.functions.invoke(
      'telegram-realtime',
      {
        body: {
          operation: 'disconnect',
          accountId
        }
      }
    );
    
    if (error) {
      console.error('Disconnect failed:', error);
      throw error;
    }
    
    console.log('Disconnect response:', data);
    return true;
  } catch (error) {
    console.error('Error disconnecting realtime:', error);
    toast.error('Failed to disconnect: ' + (error instanceof Error ? error.message : String(error)));
    return false;
  }
}

export async function setupRealtimeListener(
  selectedAccount: ApiAccount,
  channelPairs: ChannelPair[],
  onNewMessages?: (messages: Message[]) => void
) {
  console.log('Setting up realtime listener with account:', {
    ...selectedAccount,
    apiHash: '[REDACTED]'
  });
  
  try {
    // First test the connection
    console.log('Testing connection to telegram-realtime function...');
    const { data: healthCheck, error: healthError } = await supabase.functions.invoke(
      'telegram-realtime',
      {
        body: { operation: 'healthcheck' }
      }
    );

    if (healthError) {
      console.error('Health check failed:', healthError);
      toast.error('Failed to connect to Telegram service');
      throw new Error(`Health check failed: ${healthError.message}`);
    }

    console.log('Health check successful:', healthCheck);

    // Extract source channels
    const sourceChannels = channelPairs
      .filter(pair => pair.sourceChannel && pair.sourceChannel.trim() !== '')
      .map(pair => pair.sourceChannel);

    if (sourceChannels.length === 0) {
      throw new Error('No source channels configured');
    }

    console.log('Attempting to connect to channels:', sourceChannels);

    // Call the realtime function to start listening
    const { data: response, error } = await supabase.functions.invoke(
      'telegram-realtime',
      {
        body: {
          operation: 'listen',
          apiId: selectedAccount.apiKey, // Use apiKey instead of apiId
          apiHash: selectedAccount.apiHash,
          phoneNumber: selectedAccount.phoneNumber,
          accountId: selectedAccount.id,
          channelNames: sourceChannels
        }
      }
    );

    if (error) {
      console.error('Failed to setup listener:', error);
      toast.error(`Failed to connect: ${error.message}`);
      throw error;
    }

    console.log('Realtime listener setup successful:', {
      ...response,
      sessionString: response.sessionString ? `[${response.sessionString.length} chars]` : undefined
    });
    
    // Store the listener in our map
    if (response.listenerId) {
      activeListeners.set(selectedAccount.id, {
        id: response.listenerId,
        stop: async () => {
          try {
            await disconnectRealtime(selectedAccount.id);
            return true;
          } catch (error) {
            console.error('Error stopping listener:', error);
            return false;
          }
        }
      });
    }

    return response;

  } catch (error) {
    console.error('Error in setupRealtimeListener:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to connect to Telegram');
    throw error;
  }
}

/**
 * Fetch realtime metrics from the edge function
 */
export async function fetchRealtimeMetrics(accountId: string): Promise<MetricsData | null> {
  console.log('Fetching realtime metrics for account:', accountId);
  
  try {
    const { data, error } = await supabase.functions.invoke(
      'telegram-realtime',
      {
        body: {
          operation: 'metrics',
          accountId
        }
      }
    );
    
    if (error) {
      console.error('Failed to fetch metrics:', error);
      return null;
    }
    
    console.log('Metrics response:', data);
    
    if (data && data.metrics) {
      return data.metrics as MetricsData;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return null;
  }
}
