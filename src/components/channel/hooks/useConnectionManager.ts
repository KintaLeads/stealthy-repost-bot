
import { useState, useEffect } from 'react';
import { ApiAccount, ChannelPair } from '@/types/channels';
import { setupRealtimeListener, disconnectRealtime, checkRealtimeStatus } from '@/services/telegram/realtimeService';
import { toast } from 'sonner';

export const useConnectionManager = (
  account: ApiAccount | null,
  channelPairs: ChannelPair[]
) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [listener, setListener] = useState<any | null>(null);
  
  // Check connection status on initial load
  useEffect(() => {
    if (account?.id) {
      const checkConnection = async () => {
        try {
          const status = await checkRealtimeStatus(account.id);
          setIsConnected(status);
        } catch (error) {
          console.error('Error checking connection status:', error);
        }
      };
      
      checkConnection();
    } else {
      setIsConnected(false);
    }
  }, [account]);
  
  const toggleConnection = async () => {
    if (!account) {
      toast.error('No account selected');
      return null;
    }
    
    try {
      setIsConnecting(true);
      
      if (isConnected) {
        // Disconnect
        if (listener) {
          await listener.stop();
          setListener(null);
        }
        
        const success = await disconnectRealtime(account.id);
        
        if (success) {
          toast.success(`Disconnected from Telegram: ${account.nickname}`);
        } else {
          toast.error('Failed to disconnect. Please try again');
        }
        
        setIsConnected(false);
      } else {
        // Connect
        console.log('Setting up realtime listener for account:', account);
        
        const newListener = await setupRealtimeListener(
          account,
          channelPairs,
          (messages) => {
            console.log('Received new messages:', messages);
            // Handle new messages here...
          }
        );
        
        console.log('Listener setup result:', newListener);
        
        // Check if we need verification first
        if (newListener.needsVerification) {
          console.log('Authentication required, returning verification info');
          return newListener; // Return this so the UI can show the verification modal
        }
        
        setListener(newListener);
        setIsConnected(true);
        toast.success(`Connected to Telegram: ${account.nickname}`);
        
        return newListener;
      }
    } catch (error) {
      console.error('Error toggling connection:', error);
      toast.error(`Connection error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsConnecting(false);
    }
    
    return null;
  };
  
  return {
    isConnected,
    isConnecting,
    toggleConnection
  };
};
