import { useState, useEffect, useCallback } from 'react';
import { ApiAccount } from '@/types/channels';
import { ChannelPair } from '@/types/channels';
import { Message } from '@/types/dashboard';
import { toast } from '@/components/ui/use-toast';
import { verifyTelegramConnection } from '@/services/telegram/verifier';
import { validateCredentials } from '@/services/telegram/credentialValidator';
import { checkRealtimeStatus, disconnectRealtime, setupRealtimeListener } from '@/services/telegram/realtimeService';

interface UseConnectionManagerProps {
  selectedAccount: ApiAccount | null;
  channelPairs: ChannelPair[];
  onConnected: () => void;
  onDisconnected: () => void;
  onNewMessages: (messages: Message[]) => void;
}

export const useConnectionManager = ({
  selectedAccount,
  channelPairs,
  onConnected,
  onDisconnected,
  onNewMessages
}: UseConnectionManagerProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Function to check connection status
  const checkConnectionStatus = useCallback(async () => {
    if (selectedAccount) {
      try {
        const isCurrentlyConnected = await checkRealtimeStatus(selectedAccount.id);
        setIsConnected(isCurrentlyConnected);
        if (isCurrentlyConnected) {
          onConnected();
        } else {
          onDisconnected();
        }
        setConnectionError(null);
      } catch (error) {
        console.error("Error checking connection status:", error);
        setIsConnected(false);
        setConnectionError("Failed to check connection status.");
      }
    } else {
      setIsConnected(false);
    }
  }, [selectedAccount, onConnected, onDisconnected]);
  
  // Function to handle connection
  const handleConnect = useCallback(async () => {
    if (!selectedAccount) {
      toast({
        title: "No Account Selected",
        description: "Please select an account to connect.",
        variant: "destructive",
      });
      return;
    }
    
    if (channelPairs.length === 0) {
      toast({
        title: "No Channel Pairs",
        description: "Please add channel pairs before connecting.",
        variant: "destructive",
      });
      return;
    }
    
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      // Validate credentials before attempting to connect
      const isValid = validateCredentials(selectedAccount);
      if (!isValid) {
        throw new Error("Invalid API credentials. Please check your API ID, API Hash, and Phone Number.");
      }
      
      // Verify the Telegram connection
      const verificationResult = await verifyTelegramConnection(selectedAccount);
      if (!verificationResult.success) {
        throw new Error(verificationResult.error || "Failed to verify Telegram connection.");
      }
      
      // Set up the realtime listener
      await setupRealtimeListener(selectedAccount, channelPairs, onNewMessages);
      setIsConnected(true);
      onConnected();
      toast({
        title: "Connected",
        description: "Successfully connected to Telegram.",
      });
    } catch (error: any) {
      console.error("Connection error:", error);
      setIsConnected(false);
      setConnectionError(error.message || "Failed to connect to Telegram.");
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to Telegram.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [selectedAccount, channelPairs, onConnected, onNewMessages]);
  
  // Function to handle disconnection
  const handleDisconnect = useCallback(async () => {
    if (!selectedAccount) {
      return;
    }
    
    setIsConnecting(true);
    setConnectionError(null);
    
    try {
      await disconnectRealtime(selectedAccount.id);
      setIsConnected(false);
      onDisconnected();
      toast({
        title: "Disconnected",
        description: "Successfully disconnected from Telegram.",
      });
    } catch (error: any) {
      console.error("Disconnection error:", error);
      setConnectionError(error.message || "Failed to disconnect from Telegram.");
      toast({
        title: "Disconnection Failed",
        description: error.message || "Failed to disconnect from Telegram.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }, [selectedAccount, onDisconnected]);
  
  // Effect to check connection status on account change
  useEffect(() => {
    checkConnectionStatus();
  }, [selectedAccount, checkConnectionStatus]);
  
  return {
    isConnected,
    isConnecting,
    connectionError,
    handleConnect,
    handleDisconnect,
    checkConnectionStatus
  };
};
