
/**
 * Message and channel related MTProto methods
 */
import { TelegramClient } from "https://esm.sh/telegram@2.19.10";

/**
 * Handle channels.getChannels request
 */
export async function handleGetChannels(client: TelegramClient, ids: any[]): Promise<any> {
  console.log(`Getting channels for IDs: ${JSON.stringify(ids)}...`);
  
  try {
    // Convert ids to InputChannel format
    const inputChannels = ids.map(id => ({
      _: "inputChannel",
      channel_id: typeof id === 'string' ? parseInt(id, 10) : id,
      access_hash: 0  // We would need to store this from when the channel was retrieved
    }));
    
    // Make actual API call to Telegram using the GramJS client
    const result = await client.invoke({
      _: "channels.getChannels",
      id: inputChannels
    });
    
    console.log("Get channels result:", result);
    return result;
  } catch (error) {
    console.error("Error getting channels:", error);
    throw error;
  }
}

/**
 * Handle messages.getHistory request
 */
export async function handleGetHistory(client: TelegramClient, peer: any, limit: number): Promise<any> {
  console.log(`Getting message history for peer: ${JSON.stringify(peer)}, limit: ${limit}...`);
  
  try {
    // Convert peer to InputPeer format
    const inputPeer = {
      _: "inputPeerChannel",
      channel_id: peer.channelId,
      access_hash: peer.accessHash || 0
    };
    
    // Make actual API call to Telegram using the GramJS client
    const result = await client.invoke({
      _: "messages.getHistory",
      peer: inputPeer,
      offset_id: 0,
      offset_date: 0,
      add_offset: 0,
      limit: limit,
      max_id: 0,
      min_id: 0,
      hash: 0
    });
    
    console.log(`Returning ${result.messages.length} messages`);
    return result;
  } catch (error) {
    console.error("Error getting message history:", error);
    throw error;
  }
}
