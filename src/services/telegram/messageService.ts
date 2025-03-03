
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { ApiAccount, ChannelPair } from "@/types/channels";
import { Message } from "@/types/dashboard";
import { getStoredSession, storeSession } from "./sessionManager";

/**
 * Fetch messages from configured channels
 */
export const fetchChannelMessages = async (
  account: ApiAccount,
  channelPairs: ChannelPair[]
): Promise<Message[]> => {
  try {
    const sourceChannels = channelPairs
      .filter(pair => pair.isActive)
      .map(pair => pair.sourceChannel);
    
    if (sourceChannels.length === 0) {
      toast({
        title: "No Active Channels",
        description: "Please configure and activate at least one channel pair",
        variant: "destructive",
      });
      return [];
    }
    
    const sessionString = getStoredSession();
    const headers: Record<string, string> = {};
    
    if (sessionString) {
      headers['X-Telegram-Session'] = sessionString;
    }
    
    const { data, error } = await supabase.functions.invoke('telegram-connector', {
      body: {
        operation: 'listen',
        apiId: account.apiKey,
        apiHash: account.apiHash,
        phoneNumber: account.phoneNumber,
        sourceChannels
      },
      headers
    });
    
    if (error) {
      toast({
        title: "Failed to Fetch Messages",
        description: `Error fetching messages: ${error.message}`,
        variant: "destructive",
      });
      return [];
    }
    
    if (data.sessionString) {
      storeSession(data.sessionString);
    }
    
    // Map the results to our Message type
    const messages: Message[] = [];
    
    data.results.forEach(result => {
      if (result.success && result.sampleMessages) {
        const channelPair = channelPairs.find(pair => pair.sourceChannel === result.channel);
        
        result.sampleMessages.forEach(msg => {
          // Convert Telegram message to our Message format
          const message: Message = {
            id: `${result.channel}_${msg.id}`,
            text: msg.text || '',
            time: new Date(msg.date * 1000).toLocaleTimeString(),
            username: result.channel,
            processed: false
          };
          
          messages.push(message);
        });
      }
    });
    
    return messages;
  } catch (error) {
    console.error('Error fetching channel messages:', error);
    toast({
      title: "Message Fetch Error",
      description: `Failed to fetch messages: ${error.message}`,
      variant: "destructive",
    });
    return [];
  }
};

/**
 * Repost a message to target channel
 */
export const repostMessage = async (
  account: ApiAccount,
  message: Message,
  sourceChannel: string,
  targetChannel: string
): Promise<boolean> => {
  try {
    const sessionString = getStoredSession();
    const headers: Record<string, string> = {};
    
    if (sessionString) {
      headers['X-Telegram-Session'] = sessionString;
    }
    
    const messageId = message.id.split('_')[1]; // Extract original message ID
    
    const { data, error } = await supabase.functions.invoke('telegram-connector', {
      body: {
        operation: 'repost',
        apiId: account.apiKey,
        apiHash: account.apiHash,
        phoneNumber: account.phoneNumber,
        messageId,
        sourceChannel,
        targetChannel
      },
      headers
    });
    
    if (error) {
      toast({
        title: "Repost Failed",
        description: `Could not repost message: ${error.message}`,
        variant: "destructive",
      });
      return false;
    }
    
    if (data.sessionString) {
      storeSession(data.sessionString);
    }
    
    toast({
      title: "Message Reposted",
      description: "Successfully reposted message to target channel"
    });
    
    return true;
  } catch (error) {
    console.error('Error reposting message:', error);
    toast({
      title: "Repost Error",
      description: `Failed to repost message: ${error.message}`,
      variant: "destructive",
    });
    return false;
  }
};
