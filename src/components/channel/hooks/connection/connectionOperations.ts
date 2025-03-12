
import { ApiAccount, ChannelPair } from '@/types/channels';
import { handleInitialConnection } from '@/services/telegram/connector';
import { setupRealtimeListener, checkRealtimeStatus, disconnectRealtime } from '@/services/telegram/realtimeService';
import { toast } from 'sonner';

export const checkConnectionStatus = async (selectedAccount: ApiAccount): Promise<boolean> => {
  if (!selectedAccount?.id) {
    console.log('No account selected for status check');
    return false;
  }
  
  try {
    const isConnected = await checkRealtimeStatus(selectedAccount.id);
    console.log('Connection status check result:', isConnected);
    return isConnected;
  } catch (error) {
    console.error('Error checking connection status:', error);
    return false;
  }
};

export const initiateConnection = async (
  selectedAccount: ApiAccount,
  channelPairs: ChannelPair[],
  onNewMessages?: (messages: any[]) => void
) => {
  console.log('Initiating connection for account:', selectedAccount?.nickname);
  
  if (!selectedAccount) {
    toast('Please select an account first');
    return false;
  }

  try {
    // First establish initial connection
    const initialConnection = await handleInitialConnection(selectedAccount);
    console.log('Initial connection result:', initialConnection);

    if (!initialConnection.success) {
      toast({
        title: "Connection Failed",
        description: initialConnection.error || 'Failed to establish initial connection'
      });
      return false;
    }

    // Then setup realtime listener
    const realtimeResult = await setupRealtimeListener(
      selectedAccount,
      channelPairs,
      onNewMessages
    );

    console.log('Realtime setup result:', realtimeResult);

    if (!realtimeResult) {
      toast({
        title: "Setup Failed",
        description: "Failed to setup realtime connection"
      });
      return false;
    }

    toast({
      title: "Connected Successfully",
      description: `Connected to ${channelPairs.length} channel pairs`
    });
    
    return true;
  } catch (error) {
    console.error('Error in initiateConnection:', error);
    toast({
      title: "Connection Error",
      description: error instanceof Error ? error.message : 'Unknown error occurred'
    });
    return false;
  }
};

export const disconnectConnection = async (selectedAccount: ApiAccount) => {
  if (!selectedAccount?.id) {
    return false;
  }

  try {
    const result = await disconnectRealtime(selectedAccount.id);
    
    if (result) {
      toast({
        title: "Disconnected",
        description: "Successfully disconnected from Telegram"
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error disconnecting:', error);
    return false;
  }
};
