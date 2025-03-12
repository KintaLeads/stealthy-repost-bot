
// Client for handling message operations using direct HTTP
import { BaseClient } from './base-client.ts';

export class MessageClient extends BaseClient {
  constructor(apiId: string, apiHash: string, phoneNumber: string, accountId: string, sessionString: string = "") {
    super(apiId, apiHash, phoneNumber, accountId, sessionString);
    console.log("Creating MessageClient with direct HTTP implementation");
  }
  
  /**
   * Start listening to messages from channels
   */
  async listenToChannels(channels: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Starting to listen to ${channels.length} channels`);
      
      if (!this.sessionString) {
        return {
          success: false,
          error: "Not authenticated. Please authenticate first."
        };
      }
      
      // Verify each channel exists and we have access to it
      for (const channelName of channels) {
        try {
          const response = await this.callMTProto('channels.getFullChannel', {
            channel: channelName
          });
          
          console.log(`Successfully accessed channel: ${channelName}`);
        } catch (error) {
          console.error(`Error accessing channel ${channelName}:`, error);
          return {
            success: false,
            error: `Could not access channel ${channelName}: ${error instanceof Error ? error.message : "Unknown error"}`
          };
        }
      }
      
      // Setup listeners for each channel
      // Note: Actual implementation would include setting up WebSocket or long polling
      // For this basic implementation, we'll just return success
      
      return {
        success: true
      };
    } catch (error) {
      console.error("Error setting up channel listeners:", error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred"
      };
    }
  }
  
  /**
   * Repost a message from one channel to another
   */
  async repostMessage(messageId: number, sourceChannel: string, targetChannel: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Reposting message ${messageId} from ${sourceChannel} to ${targetChannel}`);
      
      if (!this.sessionString) {
        return {
          success: false,
          error: "Not authenticated. Please authenticate first."
        };
      }
      
      // First, get the message from the source channel
      try {
        const messageResponse = await this.callMTProto('channels.getMessages', {
          channel: sourceChannel,
          id: [messageId]
        });
        
        if (!messageResponse.messages || messageResponse.messages.length === 0) {
          return {
            success: false,
            error: `Message ${messageId} not found in channel ${sourceChannel}`
          };
        }
        
        const message = messageResponse.messages[0];
        
        // Now, forward the message to the target channel
        const forwardResponse = await this.callMTProto('messages.forwardMessages', {
          from_peer: sourceChannel,
          to_peer: targetChannel,
          id: [messageId],
          random_id: [Date.now()]
        });
        
        console.log("Message forwarded successfully");
        
        return {
          success: true
        };
      } catch (error) {
        console.error("Error forwarding message:", error);
        
        return {
          success: false,
          error: `Error forwarding message: ${error instanceof Error ? error.message : "Unknown error"}`
        };
      }
    } catch (error) {
      console.error("Error in repostMessage:", error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : "An unexpected error occurred"
      };
    }
  }
}
