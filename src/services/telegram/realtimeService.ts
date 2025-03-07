
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
    
    // Initial fetch of messages to populate the UI
    try {
      const messages = await fetchChannelMessages(account, channelPairs);
      if (messages.length > 0) {
        onNewMessages(messages);
      }
    } catch (initError) {
      if (String(initError).includes('authentication')) {
        logError("RealtimeService", "Authentication error during initial fetch:", initError);
        toast({
          title: "Authentication Required",
          description: "Please connect to Telegram using the connection button",
          variant: "destructive",
        });
        clearStoredSession(account.id);
        throw new Error("Authentication required");
      } else {
        logError("RealtimeService", "Error during initial fetch:", initError);
      }
    }
    
    // Set up polling interval for new messages
    // In a production app, this would be replaced with a proper realtime subscription
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
      description: "Listening for messages from configured channels"
    });
    
    // Return a function to stop the listener
    return {
      stopListener: () => {
        clearInterval(pollingInterval);
        logInfo("RealtimeService", "Realtime listener stopped");
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
