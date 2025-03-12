
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw, Activity, Link2Off } from "lucide-react";
import { setupRealtimeListener, checkRealtimeStatus } from "@/services/telegram/realtimeService";
import { ApiAccount } from "@/types/channels";
import { ChannelPair } from "@/types/channels";
import { Message } from "@/types/dashboard";
import { toast } from "@/components/ui/use-toast";

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
        toast({
          title: "No Source Channels",
          description: "Please add at least one source channel before connecting",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      console.log(`Connecting to ${validSourceChannels.length} source channels:`, validSourceChannels);
      
      // Save channel pairs before connecting (to ensure they're in the database)
      try {
        // Set up the realtime listener
        const listener = await setupRealtimeListener(
          selectedAccount,
          channelPairs,
          onNewMessages
        );
        
        // Update connection state
        setIsLoading(false);
        onConnected(listener);
        
        toast({
          title: "Connected",
          description: `Connected to ${validSourceChannels.length} source channel${validSourceChannels.length !== 1 ? 's' : ''}`,
        });
      } catch (error) {
        console.error('Error setting up realtime listener:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error connecting to realtime listener:', error);
      setIsLoading(false);
      
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
    }
  };
  
  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      
      // Call the callback to inform parent components
      onDisconnected();
      
      setIsLoading(false);
      
      toast({
        title: "Disconnected",
        description: "Real-time listener has been stopped",
      });
    } catch (error) {
      console.error('Error disconnecting from realtime listener:', error);
      setIsLoading(false);
      
      toast({
        title: "Disconnect Failed",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
      });
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
