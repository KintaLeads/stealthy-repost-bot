
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { ApiAccount } from "@/types/channels";
import { ChannelPair } from "@/types/channels";
import { Message } from "@/types/dashboard";
import { fetchChannelMessages } from "./messageService";
import { getStoredSession, clearStoredSession } from "./sessionManager";
import { logInfo, logError } from './debugger';

export const setupRealtimeListener = async (
  account: ApiAccount,
  channelPairs: ChannelPair[],
  onNewMessages: (messages: Message[]) => void
): Promise<{ stopListener: () => void }> => {
  try {
    logInfo("RealtimeService", "Setting up realtime listener for account:", account.nickname);
    
    // Validate account and session
    if (!account.id) {
      const error = new Error("Invalid account configuration");
      logError("RealtimeService", "Account validation failed:", {
        account,
        error: error.message
      });
      throw error;
    }
    
    // Check if we have a valid session
    const sessionString = getStoredSession(account.id);
    if (!sessionString) {
      logInfo("RealtimeService", "No session found for account:", account.nickname);
      
      clearStoredSession(account.id); // Clean up any invalid session data
      const error = new Error("Authentication required");
      
      logError("RealtimeService", "Session validation failed:", {
        accountId: account.id,
        error: error.message
      });
      
      toast({
        title: "Authentication Required",
        description: "Please connect to Telegram using the connection button",
        variant: "destructive",
      });
      throw error;
    }
    
    // Validate channel configuration
    const channelNames = channelPairs
      .filter(pair => pair.sourceChannel && pair.sourceChannel.trim() !== '')
      .map(pair => pair.sourceChannel);
    
    if (channelNames.length === 0) {
      const error = new Error("No channels configured");
      logError("RealtimeService", "Channel validation failed:", {
        accountId: account.id,
        error: error.message
      });
      
      toast({
        title: "No Channels Configured",
        description: "Please add source channels before connecting",
        variant: "destructive",
      });
      throw error;
    }
    
    // Call the Telegram realtime endpoint
    logInfo("RealtimeService", "Calling telegram-realtime Edge Function", {
      accountId: account.id,
      channelCount: channelNames.length
    });
    
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
      logError("RealtimeService", "Error calling realtime Edge Function:", {
        error,
        accountId: account.id,
        channelCount: channelNames.length
      });
      
      // Handle authentication errors
      if (error.status === 401 || (error.message && error.message.includes('authentication'))) {
        clearStoredSession(account.id);
        
        toast({
          title: "Authentication Required",
          description: "Your session has expired. Please reconnect to Telegram.",
          variant: "destructive",
        });
        throw new Error("Authentication required - session expired");
      }
      
      toast({
        title: "Connection Error",
        description: `Failed to connect: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
      throw error;
    }
    
    // Validate response
    if (!data.success) {
      logError("RealtimeService", "Unsuccessful realtime response:", {
        data,
        accountId: account.id
      });
      
      toast({
        title: "Listener Setup Failed",
        description: data.error || "Failed to set up Telegram listener",
        variant: "destructive",
      });
      throw new Error(data.error || "Failed to set up Telegram listener");
    }
    
    logInfo("RealtimeService", "Listener set up successfully:", data);
    
    // Initial fetch of messages
    try {
      const messages = await fetchChannelMessages(account, channelPairs);
      if (messages.length > 0) {
        onNewMessages(messages);
      }
    } catch (initError) {
      logError("RealtimeService", "Error during initial fetch:", initError);
    }
    
    // Update session if returned
    if (data.sessionString) {
      logInfo("RealtimeService", "Updating stored session");
      getStoredSession(account.id, data.sessionString);
    }
    
    // Setup polling interval
    const pollingInterval = setInterval(async () => {
      try {
        logInfo("RealtimeService", "Polling for new messages...");
        const newMessages = await fetchChannelMessages(account, channelPairs);
        
        if (newMessages.length > 0) {
          onNewMessages(newMessages);
        }
      } catch (error) {
        logError("RealtimeService", "Error in polling interval:", error);
        
        if (error instanceof Error && 
            (error.message.includes('authentication') || 
             error.message.includes('not authenticated'))) {
          clearInterval(pollingInterval);
          clearStoredSession(account.id);
          
          toast({
            title: "Authentication Error",
            description: "Listener stopped due to authentication issue. Please reconnect.",
            variant: "destructive",
          });
        }
      }
    }, 30000);
    
    toast({
      title: "Listener Active",
      description: `Listening for messages from ${channelNames.length} channel${channelNames.length !== 1 ? 's' : ''}`
    });
    
    return {
      stopListener: async () => {
        logInfo("RealtimeService", "Stopping realtime listener", {
          accountId: account.id
        });
        
        try {
          clearInterval(pollingInterval);
          
          const { error } = await supabase.functions.invoke('telegram-realtime', {
            body: {
              operation: 'disconnect',
              accountId: account.id
            }
          });
          
          if (error) {
            logError("RealtimeService", "Error disconnecting listener:", {
              error,
              accountId: account.id
            });
            throw error;
          }
          
          logInfo("RealtimeService", "Realtime listener stopped successfully");
        } catch (error) {
          logError("RealtimeService", "Error stopping listener:", {
            error,
            accountId: account.id
          });
        }
      }
    };
  } catch (error) {
    const errorDetails = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error;
    
    logError("RealtimeService", "Error setting up realtime listener:", {
      error: errorDetails,
      account: account.nickname,
      accountId: account.id
    });
    
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
