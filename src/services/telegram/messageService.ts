import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { ApiAccount } from "@/types/dashboard";
import { ChannelPair } from "@/types/channels";
import { Message } from "@/types/dashboard";
import { getStoredSession, storeSession, clearSession } from "./session/sessionManager";
import { logInfo, logError, logWarning } from './debugger';

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
      logInfo('MessageService', 'No active channels found');
      return [];
    }
    
    logInfo('MessageService', 'Fetching messages from channels:', sourceChannels);
    
    // Get stored session from local storage
    const sessionString = getStoredSession(account.id);
    
    if (!sessionString) {
      logInfo('MessageService', 'No stored session found, authentication may be required');
      toast({
        title: "Authentication Required",
        description: "Please connect to Telegram using the connection button",
        variant: "destructive",
      });
      return [];
    }
    
    logInfo('MessageService', 'Using stored session for account:', account.nickname);
    
    // Try the realtime service first (which is simpler and might work for testing)
    try {
      const response = await supabase.functions.invoke('telegram-realtime', {
        body: {
          operation: 'subscribe',
          apiId: account.apiKey,
          apiHash: account.apiHash,
          phoneNumber: account.phoneNumber,
          channelNames: sourceChannels,
          sessionString
        },
        headers: {
          'X-Telegram-Session': sessionString
        }
      });
      
      if (response.error) {
        logError('MessageService', 'Realtime service error:', response.error);
        // If it's an auth error, try the telegram-connector
        if (response.error.message && response.error.message.includes('not authenticated')) {
          // Fall through to telegram-connector
        } else {
          toast({
            title: "Failed to Fetch Messages",
            description: `Error fetching messages: ${response.error.message}`,
            variant: "destructive",
          });
          return [];
        }
      } else if (response.data && response.data.success) {
        // Process results from realtime service
        logInfo('MessageService', 'Received messages from realtime service');
        
        const messages: Message[] = [];
        
        if (response.data.results && Array.isArray(response.data.results)) {
          response.data.results.forEach(result => {
            if (result.success && result.sampleMessages) {
              const channelPair = channelPairs.find(pair => pair.sourceChannel === result.channel);
              
              result.sampleMessages.forEach(msg => {
                // Convert message to our Message format
                const message: Message = {
                  id: `${result.channel}_${msg.id}`,
                  text: msg.text || '',
                  time: new Date(msg.date * 1000).toLocaleTimeString(),
                  username: result.channel,
                  processed: false,
                  media: msg.media ? msg.media : undefined,
                  mediaAlbum: msg.mediaAlbum || undefined
                };
                
                messages.push(message);
              });
            }
          });
        }
        
        if (messages.length > 0) {
          return messages;
        }
      }
    } catch (realtimeError) {
      logError('MessageService', 'Error invoking realtime service:', realtimeError);
      // Fallback to telegram-connector
    }
    
    // Fallback to telegram-connector service
    try {
      const { data, error } = await supabase.functions.invoke('telegram-connector', {
        body: {
          operation: 'listen',
          apiId: account.apiKey,
          apiHash: account.apiHash,
          phoneNumber: account.phoneNumber,
          sourceChannels,
          accountId: account.id,
          sessionString
        },
        headers: {
          'X-Telegram-Session': sessionString
        }
      });
      
      if (error) {
        logError('MessageService', 'Supabase function error:', error);
        
        // Check if the error is related to authentication
        if (error.message && (
          error.message.includes('not authenticated') || 
          error.message.includes('authentication required')
        )) {
          logError('MessageService', 'Authentication required. User needs to reconnect');
          toast({
            title: "Authentication Required",
            description: "Please reconnect to Telegram using the connection button",
            variant: "destructive",
          });
          // Clear the invalid session
          clearStoredSession(account.id);
        } else {
          toast({
            title: "Failed to Fetch Messages",
            description: `Error fetching messages: ${error.message}`,
            variant: "destructive",
          });
        }
        return [];
      }
      
      if (!data) {
        logError('MessageService', 'No data returned from function');
        toast({
          title: "Failed to Fetch Messages",
          description: "No response from message fetching service",
          variant: "destructive",
        });
        return [];
      }
      
      // Check if we need authentication
      if (data.needsAuthentication) {
        logError('MessageService', 'Authentication required from response');
        toast({
          title: "Authentication Required",
          description: "Please connect to Telegram using the connection button",
          variant: "destructive",
        });
        // Clear the invalid session
        clearStoredSession(account.id);
        return [];
      }
      
      // Save the session if it was returned
      if (data.sessionString) {
        logInfo('MessageService', 'New session received, storing it');
        storeSession(account.id, data.sessionString);
      }
      
      // Map the results to our Message type
      const messages: Message[] = [];
      
      if (data.results && Array.isArray(data.results)) {
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
                processed: false,
                media: msg.media ? msg.media : undefined,
                mediaAlbum: msg.mediaAlbum || undefined
              };
              
              messages.push(message);
            });
          }
        });
      } else {
        logWarning('MessageService', 'Invalid results structure:', data);
      }
      
      return messages;
    } catch (error) {
      logError('MessageService', 'Error invoking Supabase function:', error);
      toast({
        title: "API Error",
        description: `Failed to send a request to the Edge Function: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
      return [];
    }
  } catch (error) {
    logError('MessageService', 'Error fetching channel messages:', error);
    toast({
      title: "Message Fetch Error",
      description: `Failed to fetch messages: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
    const sessionString = getStoredSession(account.id);
    
    if (!sessionString) {
      toast({
        title: "Authentication Required",
        description: "Please connect to Telegram before reposting messages",
        variant: "destructive",
      });
      return false;
    }
    
    const headers = {
      'X-Telegram-Session': sessionString
    };
    
    const messageId = message.id.split('_')[1]; // Extract original message ID
    
    if (!messageId) {
      toast({
        title: "Repost Failed",
        description: "Invalid message ID format",
        variant: "destructive",
      });
      return false;
    }
    
    const { data, error } = await supabase.functions.invoke('telegram-connector', {
      body: {
        operation: 'repost',
        apiId: account.apiKey,
        apiHash: account.apiHash,
        phoneNumber: account.phoneNumber,
        messageId,
        sourceChannel,
        targetChannel,
        includeMedia: true, // Tell the function to include media
        accountId: account.id,
        sessionString
      },
      headers
    });
    
    if (error) {
      // Check if authentication error
      if (error.message && (
        error.message.includes('not authenticated') || 
        error.message.includes('authentication required')
      )) {
        toast({
          title: "Authentication Required",
          description: "Please reconnect to Telegram before reposting messages",
          variant: "destructive",
        });
        // Clear the invalid session
        clearStoredSession(account.id);
      } else {
        toast({
          title: "Repost Failed",
          description: `Could not repost message: ${error.message}`,
          variant: "destructive",
        });
      }
      return false;
    }
    
    if (data.sessionString) {
      storeSession(account.id, data.sessionString);
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
      description: `Failed to repost message: ${error instanceof Error ? error.message : 'Unknown error'}`,
      variant: "destructive",
    });
    return false;
  }
};

// Helper function for clearing sessions
const clearStoredSession = (accountId: string): void => {
  try {
    logInfo('MessageService', 'Clearing invalid session for account:', accountId);
    clearSession(accountId);
  } catch (error) {
    logError('MessageService', 'Error clearing stored session:', error);
  }
};
