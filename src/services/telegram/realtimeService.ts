import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { ApiAccount } from "@/types/channels";
import { ChannelPair } from "@/types/channels";
import { Message } from "@/types/dashboard";
import { fetchChannelMessages } from "./messageService";
import { getStoredSession, clearStoredSession } from "./sessionManager";
import { logInfo, logError } from './debugger';

/**
 * Setup the realtime listener for telegram messages
 */
export const setupRealtimeListener = async (
  account: ApiAccount,
  channelPairs: ChannelPair[],
  onNewMessages: (messages: Message[]) => void
): Promise<{ stopListener: () => void }> => {
  try {
    logInfo("RealtimeService", "Setting up realtime listener for account:", account.nickname);
    
    // Check if we have a valid session first
    const sessionString = getStoredSession(account.id);
    if (!sessionString) {
      logInfo("RealtimeService", "No session found for account:", account.nickname);
      toast({
        title: "Authentication Required",
        description: "Please connect to Telegram using the connection button",
        variant: "destructive",
      });
      throw new Error("Authentication required");
    }
    
    // Extract channel names from the pairs
    const channelNames = channelPairs.map(pair => pair.sourceChannel).filter(Boolean);
    
    if (channelNames.length === 0) {
      toast({
        title: "No Channels Configured",
        description: "Please add source channels before connecting",
        variant: "destructive",
      });
      throw new Error("No channels configured");
    }
    
    // Call the real Telegram realtime endpoint to setup the listener
    logInfo("RealtimeService", "Calling telegram-realtime Edge Function to set up listener");
    
    const { data, error } = await supabase.functions.invoke('telegram-realtime', {
      body: {
        operation: 'listen',
        apiId: account.apiKey,
        apiHash: account.apiHash,
        phoneNumber: account.phoneNumber,
        accountId: account.id,
        channelNames: channelNames,
        sessionString: sessionString
      },
      headers: {
        'X-Telegram-Session': sessionString
      }
    });
    
    if (error) {
      logError("RealtimeService", "Error calling realtime Edge Function:", error);
      
      // Check if it's an authentication error
      if (error.status === 401 || (error.message && error.message.includes('authentication'))) {
        clearStoredSession(account.id);
        
        toast({
          title: "Authentication Required",
          description: "Please connect to Telegram using the connection button",
          variant: "destructive",
        });
        throw new Error("Authentication required");
      }
      
      toast({
        title: "Connection Error",
        description: error.message || "Failed to connect to Telegram",
        variant: "destructive",
      });
      throw error;
    }
    
    if (!data.success) {
      logError("RealtimeService", "Unsuccessful realtime response:", data);
      
      toast({
        title: "Listener Setup Failed",
        description: data.error || "Failed to set up Telegram listener",
        variant: "destructive",
      });
      throw new Error(data.error || "Failed to set up Telegram listener");
    }
    
    logInfo("RealtimeService", "Listener set up successfully:", data);
    
    // Initial fetch of messages to populate the UI
    try {
      const messages = await fetchChannelMessages(account, channelPairs);
      if (messages.length > 0) {
        onNewMessages(messages);
      }
    } catch (initError) {
      logError("RealtimeService", "Error during initial fetch:", initError);
      // Continue anyway, this is just to populate initial data
    }
    
    // Store session if it was returned
    if (data.sessionString) {
      logInfo("RealtimeService", "Updating stored session");
      getStoredSession(account.id, data.sessionString);
    }
    
    // Setup polling interval for new messages as a fallback mechanism
    // This ensures we get messages even if the WebSocket connection isn't delivering them
    const pollingInterval = setInterval(async () => {
      try {
        logInfo("RealtimeService", "Polling for new messages...");
        const newMessages = await fetchChannelMessages(account, channelPairs);
        
        if (newMessages.length > 0) {
          onNewMessages(newMessages);
        }
      } catch (error) {
        logError("RealtimeService", "Error in polling interval:", error);
        
        // Check if it's an authentication error
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('authentication') || errorMessage.includes('not authenticated')) {
          clearInterval(pollingInterval);
          clearStoredSession(account.id);
          
          toast({
            title: "Authentication Error",
            description: "Listener stopped due to authentication issue. Please reconnect.",
            variant: "destructive",
          });
        }
      }
    }, 30000); // Poll every 30 seconds
    
    toast({
      title: "Listener Active",
      description: `Listening for messages from ${channelNames.length} channel${channelNames.length !== 1 ? 's' : ''}`
    });
    
    // Return a function to stop the listener
    return {
      stopListener: async () => {
        logInfo("RealtimeService", "Stopping realtime listener");
        clearInterval(pollingInterval);
        
        try {
          // Call the disconnect operation
          await supabase.functions.invoke('telegram-realtime', {
            body: {
              operation: 'disconnect',
              accountId: account.id
            }
          });
          
          logInfo("RealtimeService", "Realtime listener stopped successfully");
        } catch (error) {
          logError("RealtimeService", "Error stopping listener:", error);
          // Continue with local cleanup even if the remote disconnect fails
        }
      }
    };
  } catch (error) {
    logError("RealtimeService", "Error setting up realtime listener:", error);
    toast({
      title: "Listener Error",
      description: `Failed to setup listener: ${error instanceof Error ? error.message : String(error)}`,
      variant: "destructive",
    });
    throw error;
  }
};

// Helper to check connection status
export const checkRealtimeStatus = async (account: ApiAccount): Promise<boolean> => {
  try {
    logInfo("RealtimeService", "Checking realtime status for account:", account.nickname);
    
    const { data, error } = await supabase.functions.invoke('telegram-realtime', {
      body: {
        operation: 'status',
        accountId: account.id
      }
    });
    
    if (error || !data.success) {
      logError("RealtimeService", "Error checking status:", error || data);
      return false;
    }
    
    logInfo("RealtimeService", "Connection status:", data.connected);
    return data.connected;
  } catch (error) {
    logError("RealtimeService", "Exception checking status:", error);
    return false;
  }
};

// Helper to disconnect from realtime
export const disconnectRealtime = async (account: ApiAccount): Promise<boolean> => {
  try {
    logInfo("RealtimeService", "Disconnecting from realtime for account:", account.nickname);
    
    const { data, error } = await supabase.functions.invoke('telegram-realtime', {
      body: {
        operation: 'disconnect',
        accountId: account.id
      }
    });
    
    if (error) {
      logError("RealtimeService", "Error disconnecting:", error);
      return false;
    }
    
    logInfo("RealtimeService", "Disconnect result:", data);
    return data.success;
  } catch (error) {
    logError("RealtimeService", "Exception disconnecting:", error);
    return false;
  }
};
