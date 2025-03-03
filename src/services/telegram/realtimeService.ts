
import { ApiAccount, ChannelPair } from "@/types/channels";
import { Message } from "@/types/dashboard";
import { MessageCallback, RealtimeListenerResult } from "./types";
import { fetchChannelMessages } from "./messageService";

/**
 * Create a real-time listener for Telegram messages
 */
export const setupRealtimeListener = async (
  account: ApiAccount,
  channelPairs: ChannelPair[],
  onNewMessages: MessageCallback
): Promise<RealtimeListenerResult> => {
  // Initial fetch to get current messages
  const initialMessages = await fetchChannelMessages(account, channelPairs);
  if (initialMessages.length > 0) {
    onNewMessages(initialMessages);
  }
  
  // Setup polling every 30 seconds (as a fallback for realtime)
  const intervalId = setInterval(async () => {
    try {
      const newMessages = await fetchChannelMessages(account, channelPairs);
      if (newMessages.length > 0) {
        onNewMessages(newMessages);
      }
    } catch (error) {
      console.error('Error in polling for messages:', error);
    }
  }, 30000); // 30 seconds
  
  // Return a function to stop the listener
  return {
    stopListener: () => {
      clearInterval(intervalId);
    }
  };
};
