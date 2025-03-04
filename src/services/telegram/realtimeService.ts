
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { ApiAccount } from "@/types/channels";
import { ChannelPair } from "@/types/channels";
import { Message } from "@/types/dashboard";
import { fetchChannelMessages } from "./messageService";

/**
 * Setup the realtime listener for telegram messages
 */
export const setupRealtimeListener = async (
  account: ApiAccount,
  channelPairs: ChannelPair[],
  onNewMessages: (messages: Message[]) => void
): Promise<{ stopListener: () => void }> => {
  try {
    console.log("Setting up realtime listener for account:", account.nickname);
    
    // Initial fetch of messages to populate the UI
    const messages = await fetchChannelMessages(account, channelPairs);
    if (messages.length > 0) {
      onNewMessages(messages);
    }
    
    // Set up polling interval for new messages
    // In a production app, this would be replaced with a proper realtime subscription
    const pollingInterval = setInterval(async () => {
      try {
        console.log("Polling for new messages...");
        const newMessages = await fetchChannelMessages(account, channelPairs);
        if (newMessages.length > 0) {
          onNewMessages(newMessages);
        }
      } catch (error) {
        console.error("Error in polling interval:", error);
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
        console.log("Realtime listener stopped");
      }
    };
  } catch (error) {
    console.error("Error setting up realtime listener:", error);
    toast({
      title: "Listener Error",
      description: `Failed to setup listener: ${error.message}`,
      variant: "destructive",
    });
    throw error;
  }
};
