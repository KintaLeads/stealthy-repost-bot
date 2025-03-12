
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { ApiAccount, ChannelPair } from "@/types/channels";
import { Message } from "@/types/dashboard";
import { logInfo, logError } from './debugger';
import { getStoredSession, validateSession } from './session/sessionManager';
import { connectToTelegram } from './connection/connectionManager';

/**
 * Sets up a realtime listener for Telegram messages
 */
export const setupRealtimeListener = async (
  account: ApiAccount,
  channelPairs: ChannelPair[],
  onNewMessages: (messages: Message[]) => void
): Promise<{ stopListener: () => void }> => {
  try {
    logInfo("RealtimeService", "Setting up realtime listener", account.nickname);

    // Validate session first
    const isSessionValid = await validateSession(account);
    if (!isSessionValid) {
      logInfo("RealtimeService", "Session invalid, attempting to reconnect");
      
      const connectionResult = await connectToTelegram(account);
      if (!connectionResult.success) {
        throw new Error(connectionResult.error || "Failed to establish connection");
      }
    }

    const session = getStoredSession(account.id);
    if (!session) {
      throw new Error("No valid session available");
    }

    // Validate channel configuration
    const validChannels = channelPairs.filter(pair => 
      pair.sourceChannel && pair.sourceChannel.trim() !== ''
    );

    if (validChannels.length === 0) {
      throw new Error("No valid channels configured");
    }

    // Set up realtime listener
    const { data, error } = await supabase.functions.invoke('telegram-realtime', {
      body: {
        operation: 'listen',
        accountId: account.id,
        channelPairs: validChannels,
        sessionString: session
      }
    });

    if (error || !data.success) {
      throw error || new Error(data.error || "Failed to setup listener");
    }

    logInfo("RealtimeService", "Listener setup successful");

    // Return cleanup function
    return {
      stopListener: async () => {
        try {
          await disconnectRealtime(account);
          logInfo("RealtimeService", "Listener stopped");
        } catch (error) {
          logError("RealtimeService", "Error stopping listener:", error);
        }
      }
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError("RealtimeService", "Setup error:", error);
    
    toast({
      title: "Listener Setup Failed",
      description: errorMessage,
      variant: "destructive",
    });
    
    throw error;
  }
};

/**
 * Checks the status of the realtime listener
 */
export const checkRealtimeStatus = async (account: ApiAccount): Promise<boolean> => {
  try {
    logInfo("RealtimeService", "Checking realtime status for", account.nickname);

    // We need a session to check status
    const session = getStoredSession(account.id);
    if (!session) {
      logInfo("RealtimeService", "No session available for status check");
      return false;
    }

    // Check status with the function
    const { data, error } = await supabase.functions.invoke('telegram-realtime', {
      body: {
        operation: 'status',
        accountId: account.id,
        sessionString: session
      }
    });

    if (error) {
      logError("RealtimeService", "Status check error:", error);
      return false;
    }

    const isConnected = data?.connected === true;
    logInfo("RealtimeService", `Status check result: ${isConnected ? 'connected' : 'disconnected'}`);
    
    return isConnected;
  } catch (error) {
    logError("RealtimeService", "Status check error:", error);
    return false;
  }
};

/**
 * Disconnects the realtime listener
 */
export const disconnectRealtime = async (account: ApiAccount): Promise<boolean> => {
  try {
    logInfo("RealtimeService", "Disconnecting realtime listener for", account.nickname);
    
    // We need a session to disconnect
    const session = getStoredSession(account.id);
    if (!session) {
      logInfo("RealtimeService", "No session available for disconnect");
      return false;
    }

    // Call the disconnect operation
    const { data, error } = await supabase.functions.invoke('telegram-realtime', {
      body: {
        operation: 'disconnect',
        accountId: account.id,
        sessionString: session
      }
    });

    if (error) {
      logError("RealtimeService", "Disconnect error:", error);
      return false;
    }

    logInfo("RealtimeService", "Disconnect successful");
    return data?.success === true;
  } catch (error) {
    logError("RealtimeService", "Disconnect error:", error);
    return false;
  }
};
