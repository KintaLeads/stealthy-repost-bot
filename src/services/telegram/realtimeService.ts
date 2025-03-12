
import { ApiAccount } from '@/types/channels';
import { ChannelPair } from '@/types/channels';
import { Message } from '@/types/dashboard';
import { supabase } from '@/integrations/supabase/client';
import { getStoredSession } from './session/sessionManager';
import { logInfo, logError, logWarning, trackApiCall } from './debugger';
import { toast } from '@/components/ui/use-toast';

// Store active listeners
const activeListeners = new Map();

/**
 * Check if there's an active realtime connection
 */
export const checkRealtimeStatus = async (
  account: ApiAccount
): Promise<boolean> => {
  const context = 'RealtimeService';
  logInfo(context, `Checking realtime status for account: ${account.nickname || account.phoneNumber}`);
  
  try {
    // Check if we have an active listener in memory
    if (activeListeners.has(account.id)) {
      logInfo(context, 'Found active listener in memory');
      return true;
    }
    
    // Get stored session
    const sessionString = getStoredSession(account.id);
    if (!sessionString) {
      logInfo(context, 'No session found, not connected');
      return false;
    }
    
    // Check status with edge function
    logInfo(context, 'Checking status with edge function');
    
    const { data, error } = await supabase.functions.invoke('telegram-realtime', {
      body: {
        operation: 'status',
        accountId: account.id
      },
      headers: {
        'X-Telegram-Session': sessionString
      }
    });
    
    // Track API call
    trackApiCall('telegram-realtime/status', { accountId: account.id }, data, error);
    
    if (error) {
      logError(context, 'Error checking realtime status:', error);
      return false;
    }
    
    logInfo(context, 'Status check result:', data);
    
    return data?.connected === true;
  } catch (error) {
    logError(context, 'Exception checking realtime status:', error);
    console.error('Full error details:', error);
    return false;
  }
};

/**
 * Disconnect from realtime listener
 */
export const disconnectRealtime = async (
  account: ApiAccount
): Promise<boolean> => {
  const context = 'RealtimeService';
  logInfo(context, `Disconnecting realtime listener for account: ${account.nickname || account.phoneNumber}`);
  
  try {
    // Remove from local tracking
    if (activeListeners.has(account.id)) {
      const listener = activeListeners.get(account.id);
      logInfo(context, `Removing listener: ${listener.id}`);
      activeListeners.delete(account.id);
    }
    
    // Get stored session
    const sessionString = getStoredSession(account.id);
    
    // Call edge function to disconnect
    logInfo(context, 'Calling edge function to disconnect');
    console.log('Calling telegram-realtime with disconnect operation');
    
    const { data, error } = await supabase.functions.invoke('telegram-realtime', {
      body: {
        operation: 'disconnect',
        accountId: account.id
      },
      headers: sessionString ? {
        'X-Telegram-Session': sessionString
      } : {}
    });
    
    // Track API call
    trackApiCall('telegram-realtime/disconnect', { accountId: account.id }, data, error);
    
    if (error) {
      logError(context, 'Error disconnecting realtime:', error);
      console.error('Full error object:', error);
      return false;
    }
    
    logInfo(context, 'Disconnect result:', data);
    
    return data?.success === true;
  } catch (error) {
    logError(context, 'Exception disconnecting realtime:', error);
    console.error('Full error stack:', error instanceof Error ? error.stack : error);
    return false;
  }
};

/**
 * Set up a realtime listener for Telegram channels
 */
export const setupRealtimeListener = async (
  account: ApiAccount,
  channelPairs: ChannelPair[],
  onNewMessages: (messages: Message[]) => void
) => {
  const context = 'RealtimeService';
  logInfo(context, `Setting up realtime listener for account: ${account.nickname || account.phoneNumber}`);
  
  try {
    // Get valid source channels from pairs
    const sourceChannels = channelPairs
      .filter(pair => pair.sourceChannel && pair.sourceChannel.trim() !== '')
      .map(pair => pair.sourceChannel);
    
    if (sourceChannels.length === 0) {
      logError(context, 'No valid source channels to listen to');
      throw new Error('No valid source channels to listen to');
    }
    
    // Get stored session
    const sessionString = getStoredSession(account.id);
    if (!sessionString) {
      logError(context, 'No session found, cannot connect');
      throw new Error('Authentication required. Please connect to Telegram first.');
    }
    
    // Log what we're about to do
    logInfo(context, `Listening to ${sourceChannels.length} channels:`, sourceChannels);
    
    // Call the edge function
    logInfo(context, 'Calling telegram-realtime edge function');
    console.log('Invoking telegram-realtime with operation: listen');
    console.log('Request data:', {
      operation: 'listen',
      apiId: account.apiKey,
      apiHash: '[REDACTED]',
      phoneNumber: account.phoneNumber,
      accountId: account.id,
      channelNames: sourceChannels,
      sessionPresent: !!sessionString
    });
    
    const { data, error } = await supabase.functions.invoke('telegram-realtime', {
      body: {
        operation: 'listen',
        apiId: account.apiKey,
        apiHash: account.apiHash,
        phoneNumber: account.phoneNumber,
        accountId: account.id,
        channelNames: sourceChannels,
        sessionString: sessionString
      },
      headers: {
        'X-Telegram-Session': sessionString,
        'Content-Type': 'application/json'
      }
    });
    
    // Track API call
    trackApiCall('telegram-realtime/listen', {
      accountId: account.id,
      channelCount: sourceChannels.length
    }, data, error);
    
    if (error) {
      logError(context, 'Edge function error:', error);
      console.error('Complete error details:', error);
      toast({
        title: "Connection Error",
        description: error.message || "Failed to connect to Telegram",
        variant: "destructive",
      });
      throw new Error(error.message || 'Failed to set up realtime listener');
    }
    
    if (!data || !data.success) {
      const errorMessage = data?.error || 'Unknown error setting up listener';
      logError(context, 'Setup failed:', errorMessage);
      toast({
        title: "Setup Failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw new Error(errorMessage);
    }
    
    // Success toast
    toast({
      title: "Connection Successful",
      description: `Listening to ${sourceChannels.length} channels`,
    });
    
    // Store in our active listeners map
    const listenerId = data.listenerId || `listener_${account.id}_${Date.now()}`;
    
    activeListeners.set(account.id, {
      id: listenerId,
      channels: sourceChannels,
      startTime: new Date(),
      stop: () => disconnectRealtime(account)
    });
    
    logInfo(context, `Listener ${listenerId} created successfully`);
    
    // Return the listener object
    return {
      id: listenerId,
      stop: () => disconnectRealtime(account)
    };
  } catch (error) {
    logError(context, 'Exception setting up realtime listener:', error);
    console.error('Full error object:', error);
    throw error;
  }
};
