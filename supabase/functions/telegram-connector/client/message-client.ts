
// Client class for handling Telegram message operations
import { BaseTelegramClient } from './base-client.ts';
import { Api } from 'npm:telegram@2.26.22';

export class MessageClient extends BaseTelegramClient {
  constructor(apiId: string, apiHash: string, phoneNumber: string, accountId: string, sessionString: string = "") {
    super(apiId, apiHash, phoneNumber, accountId, sessionString);
  }
  
  /**
   * Start listening to specified channels
   */
  async listenToChannels(channels: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      if (!channels || channels.length === 0) {
        return {
          success: false,
          error: "No channels specified"
        };
      }
      
      console.log(`Starting to listen to ${channels.length} channels...`);
      
      // Start the client if not already started
      await this.startClient();
      
      // Check if authenticated
      const isAuthenticated = await this.isAuthenticated();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: "Not authenticated. Please authenticate before listening to channels."
        };
      }
      
      // Process each channel to make sure it exists and we can access it
      for (const channelUsername of channels) {
        try {
          // Normalize the channel username
          const normalizedUsername = channelUsername.startsWith('@') 
            ? channelUsername.substring(1) 
            : channelUsername;
          
          console.log(`Checking access to channel: ${normalizedUsername}`);
          
          // Try to resolve the channel entity
          await this.client.getEntity(normalizedUsername);
          
          console.log(`Successfully verified access to channel: ${normalizedUsername}`);
        } catch (channelError) {
          console.error(`Error accessing channel ${channelUsername}:`, channelError);
          return {
            success: false,
            error: `Could not access channel ${channelUsername}: ${channelError instanceof Error ? channelError.message : "Unknown error"}`
          };
        }
      }
      
      console.log("Successfully verified access to all channels");
      
      return {
        success: true
      };
    } catch (error) {
      console.error("Error listening to channels:", error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred while listening to channels"
      };
    }
  }
  
  /**
   * Repost a message from one channel to another
   */
  async repostMessage(messageId: number, sourceChannel: string, targetChannel: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!messageId || !sourceChannel || !targetChannel) {
        return {
          success: false,
          error: "Missing required parameters: messageId, sourceChannel, and targetChannel are required"
        };
      }
      
      console.log(`Reposting message (${messageId}) from ${sourceChannel} to ${targetChannel}...`);
      
      // Start the client if not already started
      await this.startClient();
      
      // Check if authenticated
      const isAuthenticated = await this.isAuthenticated();
      
      if (!isAuthenticated) {
        return {
          success: false,
          error: "Not authenticated. Please authenticate before reposting messages."
        };
      }
      
      // Normalize channel usernames
      const normalizedSourceChannel = sourceChannel.startsWith('@') 
        ? sourceChannel.substring(1) 
        : sourceChannel;
      
      const normalizedTargetChannel = targetChannel.startsWith('@') 
        ? targetChannel.substring(1) 
        : targetChannel;
      
      // Try to resolve the source channel entity
      let sourceChannelEntity;
      try {
        console.log(`Resolving source channel: ${normalizedSourceChannel}`);
        sourceChannelEntity = await this.client.getEntity(normalizedSourceChannel);
      } catch (sourceError) {
        console.error(`Error resolving source channel ${normalizedSourceChannel}:`, sourceError);
        return {
          success: false,
          error: `Could not access source channel ${normalizedSourceChannel}: ${sourceError instanceof Error ? sourceError.message : "Unknown error"}`
        };
      }
      
      // Try to resolve the target channel entity
      let targetChannelEntity;
      try {
        console.log(`Resolving target channel: ${normalizedTargetChannel}`);
        targetChannelEntity = await this.client.getEntity(normalizedTargetChannel);
      } catch (targetError) {
        console.error(`Error resolving target channel ${normalizedTargetChannel}:`, targetError);
        return {
          success: false,
          error: `Could not access target channel ${normalizedTargetChannel}: ${targetError instanceof Error ? targetError.message : "Unknown error"}`
        };
      }
      
      // Get the message from the source channel
      try {
        console.log(`Fetching message with ID ${messageId} from ${normalizedSourceChannel}`);
        
        // Get messages from the source channel
        const messages = await this.client.getMessages(sourceChannelEntity, { ids: [messageId] });
        
        if (!messages || messages.length === 0) {
          return {
            success: false,
            error: `Message with ID ${messageId} not found in ${normalizedSourceChannel}`
          };
        }
        
        const message = messages[0];
        
        // Forward the message to the target channel
        console.log(`Forwarding message to ${normalizedTargetChannel}`);
        await this.client.forwardMessages(targetChannelEntity, { messages: [message.id], fromPeer: sourceChannelEntity });
        
        console.log("Message forwarded successfully");
        
        return {
          success: true
        };
      } catch (messageError) {
        console.error("Error reposting message:", messageError);
        return {
          success: false,
          error: `Error reposting message: ${messageError instanceof Error ? messageError.message : "Unknown error"}`
        };
      }
    } catch (error) {
      console.error("Error reposting message:", error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred while reposting the message"
      };
    }
  }
}
