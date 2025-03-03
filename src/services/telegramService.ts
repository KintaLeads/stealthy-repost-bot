
import { supabase } from "@/integrations/supabase/client";
import { ApiAccount, ChannelPair } from "@/types/channels";
import { Message } from "@/types/dashboard";
import { toast } from "@/components/ui/use-toast";

export interface TelegramSession {
  sessionString: string;
  createdAt: Date;
}

// Local storage keys
const SESSION_STORAGE_KEY = 'telegram_session';

// Store the Telegram session
const storeSession = (sessionString: string) => {
  const session: TelegramSession = {
    sessionString,
    createdAt: new Date()
  };
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
};

// Get the stored session if valid (not older than 1 day)
const getStoredSession = (): string | null => {
  const sessionJson = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!sessionJson) return null;
  
  try {
    const session: TelegramSession = JSON.parse(sessionJson);
    const now = new Date();
    const sessionDate = new Date(session.createdAt);
    
    // Check if session is older than 1 day
    if ((now.getTime() - sessionDate.getTime()) > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    
    return session.sessionString;
  } catch (error) {
    console.error('Error parsing stored session:', error);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
};

// Connect to Telegram
export const connectToTelegram = async (account: ApiAccount): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('telegram-connector', {
      body: {
        operation: 'connect',
        apiId: account.apiKey,
        apiHash: account.apiHash,
        phoneNumber: account.phoneNumber
      }
    });
    
    if (error) {
      toast({
        title: "Connection Failed",
        description: `Could not connect to Telegram: ${error.message}`,
        variant: "destructive",
      });
      return false;
    }
    
    if (data.sessionString) {
      storeSession(data.sessionString);
    }
    
    toast({
      title: "Connected to Telegram",
      description: "Successfully connected to Telegram API"
    });
    
    return true;
  } catch (error) {
    console.error('Error connecting to Telegram:', error);
    toast({
      title: "Connection Error",
      description: `Failed to connect to Telegram API: ${error.message}`,
      variant: "destructive",
    });
    return false;
  }
};

// Listen to channel messages
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

// Repost a message to target channel
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

// Create a realtime listener for Telegram messages
export const setupRealtimeListener = async (
  account: ApiAccount,
  channelPairs: ChannelPair[],
  onNewMessages: (messages: Message[]) => void
): Promise<{ stopListener: () => void }> => {
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
