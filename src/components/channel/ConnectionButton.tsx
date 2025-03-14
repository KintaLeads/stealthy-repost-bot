
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw, Activity, Link2Off } from "lucide-react";
import { setupRealtimeListener } from "@/services/telegram/realtimeService";
import { ApiAccount, ChannelPair } from "@/types/channels";
import { Message } from "@/types/dashboard";
import { toast } from "sonner";

interface ConnectionButtonProps {
  selectedAccount: ApiAccount;
  isConnected: boolean;
  isConnecting: boolean;
  channelPairs: ChannelPair[];
  isSaving: boolean;
  onConnected: (listener: any) => void;
  onDisconnected: () => void;
  onNewMessages?: (messages: Message[]) => void;
}

const ConnectionButton: React.FC<ConnectionButtonProps> = ({
  selectedAccount,
  isConnected,
  isConnecting,
  channelPairs,
  isSaving,
  onConnected,
  onDisconnected,
  onNewMessages = () => {}
}) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleConnect = async () => {
    try {
      setIsLoading(true);
      
      // Validate that we have channel pairs with source channels defined
      const validSourceChannels = channelPairs
        .filter(pair => pair.sourceChannel && pair.sourceChannel.trim() !== '')
        .map(pair => pair.sourceChannel);
      
      if (validSourceChannels.length === 0) {
        toast.error("Please add at least one source channel before connecting");
        setIsLoading(false);
        return;
      }
      
      console.log(`Connecting to ${validSourceChannels.length} source channels:`, validSourceChannels);
      console.log('Selected account:', selectedAccount);
      
      try {
        // Set up the realtime listener
        console.log('Calling setupRealtimeListener with:', {
          accountId: selectedAccount.id,
          channelPairsCount: channelPairs.length,
          validSourceChannels
        });
        
        const listener = await setupRealtimeListener(
          selectedAccount,
          channelPairs,
          onNewMessages
        );
        
        console.log('Listener response:', listener);
        
        // Update connection state
        setIsLoading(false);
        
        // Only call onConnected if we got a valid listener back
        if (listener && (listener.id || listener.stop)) {
          console.log("Got valid listener, calling onConnected:", listener);
          onConnected(listener);
          
          toast.success(`Connected to ${validSourceChannels.length} source channel${validSourceChannels.length !== 1 ? 's' : ''}`);
        } else {
          console.error("Invalid listener returned:", listener);
          throw new Error("Failed to get a valid listener from setupRealtimeListener");
        }
      } catch (error) {
        console.error('Error setting up realtime listener:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error connecting to realtime listener:', error);
      setIsLoading(false);
      
      toast.error(error instanceof Error ? error.message : String(error));
    }
  };
  
  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      
      // Call the callback to inform parent components
      onDisconnected();
      
      setIsLoading(false);
      
      toast.success("Real-time listener has been stopped");
    } catch (error) {
      console.error('Error disconnecting from realtime listener:', error);
      setIsLoading(false);
      
      toast.error(error instanceof Error ? error.message : String(error));
    }
  };
  
  // Check if we have valid channels configured
  const hasValidChannels = channelPairs.some(pair => 
    pair.sourceChannel && pair.sourceChannel.trim() !== '' && 
    pair.targetChannel && pair.targetChannel.trim() !== ''
  );
  
  return (
    <Button
      variant={isConnected ? "destructive" : "default"}
      onClick={isConnected ? handleDisconnect : handleConnect}
      disabled={isLoading || isSaving || !hasValidChannels}
      className="flex items-center justify-center gap-2"
    >
      {isLoading ? (
        <>
          <RefreshCw className="h-4 w-4 animate-spin" />
          {isConnected ? 'Disconnecting...' : 'Connecting...'}
        </>
      ) : isConnected ? (
        <>
          <Link2Off className="h-4 w-4" />
          Disconnect
        </>
      ) : (
        <>
          <Activity className="h-4 w-4" />
          Connect
        </>
      )}
    </Button>
  );
};

export default ConnectionButton;
