// Client class for handling Telegram messages
import { BaseTelegramClient } from './base-client.ts';
import { Api } from 'npm:telegram/tl';

export class MessageClient extends BaseTelegramClient {
  constructor(apiId: string, apiHash: string, phoneNumber: string, accountId: string, sessionString: string = "") {
    super(apiId, apiHash, phoneNumber, accountId, sessionString);
    console.log("Creating MessageClient");
  }
  
  /**
   * Listen to messages from the specified channels
   */
  async listenToChannels(channels: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Starting to listen to channels: ${channels.join(', ')}`);
      
      // Start the client
      await this.startClient();
      
      // Resolve the channel IDs for the given channel names
      const channelIds = await Promise.all(
        channels.map(async (channel) => {
          try {
            const resolvedPeer = await this.client.invoke(
              new Api.contacts.ResolveUsername({
                username: channel
              })
            );
            
            if (resolvedPeer?.chats?.[0]?.id) {
              return resolvedPeer.chats[0].id;
            } else {
              console.warn(`Could not resolve channel ID for ${channel}`);
              return null;
            }
          } catch (resolveError) {
            console.error(`Error resolving channel ${channel}:`, resolveError);
            return null;
          }
        })
      );
      
      // Filter out any channels that couldn't be resolved
      const validChannelIds = channelIds.filter((id): id is number => id !== null);
      
      if (validChannelIds.length === 0) {
        return {
          success: false,
          error: "No valid channels to listen to"
        };
      }
      
      console.log(`Resolved channel IDs: ${validChannelIds.join(', ')}`);
      
      // Add event handler for new messages
      this.client.addEventHandler((event) => {
        if (event instanceof Api.events.NewMessage) {
          const message = event.message;
          
          // Check if the message is from one of the channels we're listening to
          if (validChannelIds.includes(message.peerId?.channelId as number)) {
            console.log(`New message from channel ${message.peerId?.channelId}: ${message.message}`);
            // TODO: Implement logic to handle the new message (e.g., save to database, repost, etc.)
          }
        }
      });
      
      console.log("Listening for new messages...");
      
      return {
        success: true
      };
    } catch (error) {
      console.error("Error listening to channels:", error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to listen to channels"
      };
    }
  }
  
  /**
   * Repost a message from one channel to another
   */
  async repostMessage(messageId: number, sourceChannel: string, targetChannel: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Reposting message ${messageId} from ${sourceChannel} to ${targetChannel}`);
      
      // Start the client
      await this.startClient();
      
      // Resolve the source channel ID
      const sourcePeer = await this.client.invoke(
        new Api.contacts.ResolveUsername({
          username: sourceChannel
        })
      );
      
      const sourceChannelId = sourcePeer?.chats?.[0]?.id;
      
      if (!sourceChannelId) {
        return {
          success: false,
          error: `Could not resolve source channel ID for ${sourceChannel}`
        };
      }
      
      // Resolve the target channel ID
      const targetPeer = await this.client.invoke(
        new Api.contacts.ResolveUsername({
          username: targetChannel
        })
      );
      
      const targetChannelId = targetPeer?.chats?.[0]?.id;
      
      if (!targetChannelId) {
        return {
          success: false,
          error: `Could not resolve target channel ID for ${targetChannel}`
        };
      }
      
      // Get the message from the source channel
      const messages = await this.client.invoke(
        new Api.channels.GetMessages({
          channel: sourceChannelId,
          id: [
            {
              _: 'InputMessageID',
              id: messageId
            }
          ]
        })
      );
      
      if (!messages?.messages?.[0]) {
        return {
          success: false,
          error: `Message ${messageId} not found in channel ${sourceChannel}`
        };
      }
      
      const messageToRepost = messages.messages[0];
      
      // Check if the message is an instance of Message
      if (!(messageToRepost instanceof Api.Message)) {
        return {
          success: false,
          error: `Unexpected message type: ${messageToRepost._}`
        };
      }
      
      // Repost the message to the target channel
      await this.client.invoke(
        new Api.messages.SendMedia({
          peer: targetChannelId,
          media: {
            _: 'InputMediaEmpty'
          },
          message: messageToRepost.message,
          randomId: BigInt(Math.floor(Math.random() * 10000000000))
        })
      );
      
      console.log(`Reposted message ${messageId} from ${sourceChannel} to ${targetChannel}`);
      
      return {
        success: true
      };
    } catch (error) {
      console.error("Error reposting message:", error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to repost message"
      };
    }
  }
}
