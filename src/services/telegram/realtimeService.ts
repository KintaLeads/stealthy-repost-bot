
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ApiAccount, ChannelPair } from '@/types/channels';
import { Message } from '@/types/dashboard';

export async function setupRealtimeListener(
  selectedAccount: ApiAccount,
  channelPairs: ChannelPair[],
  onNewMessages?: (messages: Message[]) => void
) {
  console.log('Setting up realtime listener with account:', {
    ...selectedAccount,
    apiHash: '[REDACTED]'
  });
  
  try {
    // First test the connection
    console.log('Testing connection to telegram-realtime function...');
    const { data: healthCheck, error: healthError } = await supabase.functions.invoke(
      'telegram-realtime',
      {
        body: { operation: 'healthcheck' }
      }
    );

    if (healthError) {
      console.error('Health check failed:', healthError);
      toast.error('Failed to connect to Telegram service');
      throw new Error(`Health check failed: ${healthError.message}`);
    }

    console.log('Health check successful:', healthCheck);

    // Extract source channels
    const sourceChannels = channelPairs
      .filter(pair => pair.sourceChannel && pair.sourceChannel.trim() !== '')
      .map(pair => pair.sourceChannel);

    if (sourceChannels.length === 0) {
      throw new Error('No source channels configured');
    }

    console.log('Attempting to connect to channels:', sourceChannels);

    // Call the realtime function to start listening
    const { data: response, error } = await supabase.functions.invoke(
      'telegram-realtime',
      {
        body: {
          operation: 'listen',
          apiId: selectedAccount.apiId,
          apiHash: selectedAccount.apiHash,
          phoneNumber: selectedAccount.phoneNumber,
          accountId: selectedAccount.id,
          channelNames: sourceChannels
        }
      }
    );

    if (error) {
      console.error('Failed to setup listener:', error);
      toast.error(`Failed to connect: ${error.message}`);
      throw error;
    }

    console.log('Realtime listener setup successful:', {
      ...response,
      sessionString: response.sessionString ? `[${response.sessionString.length} chars]` : undefined
    });

    return response;

  } catch (error) {
    console.error('Error in setupRealtimeListener:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to connect to Telegram');
    throw error;
  }
}
