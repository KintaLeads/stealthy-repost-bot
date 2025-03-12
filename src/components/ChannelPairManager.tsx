import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { ApiAccount } from "@/types/channels";
import EmptyChannelState from "./channel/EmptyChannelState";
import ChannelPairsList from "./channel/ChannelPairsList";
import ChannelPairHeader from "./channel/ChannelPairHeader";
import ConnectionButton from "./channel/ConnectionButton";
import SaveConfigButton from "./channel/SaveConfigButton";
import { useChannelPairs } from "@/hooks/useChannelPairs";
import { toast } from "@/components/ui/use-toast";
import { Message } from "@/types/dashboard";
import { setupRealtimeListener } from "@/services/telegram";

interface ChannelPairManagerProps {
  selectedAccount: ApiAccount | null;
  isConnected: boolean;
  onToggleConnection: () => void;
  onNewMessages?: (messages: Message[]) => void;
}

// Define a proper interface for the listener state
interface ListenerState {
  id?: any;
  stopListener?: () => void;
  stop?: () => Promise<boolean>;
}

const ChannelPairManager: React.FC<ChannelPairManagerProps> = ({ 
  selectedAccount, 
  isConnected,
  onToggleConnection,
  onNewMessages = () => {}
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  // Update the type of listenerState to match our new interface
  const [listenerState, setListenerState] = useState<ListenerState | null>(null);
  
  const {
    channelPairs,
    isLoading,
    isSaving,
    isAutoRepost,
    setIsAutoRepost,
    handleChannelPairChange,
    addChannelPair,
    removeChannelPair,
    saveChannelPairs
  } = useChannelPairs(selectedAccount);
  
  // Handle connection state change
  const handleConnected = (listener: any) => {
    // Convert any listener object to our ListenerState type
    const listenerObj: ListenerState = {
      id: listener.id,
      stop: listener.stop
    };
    setListenerState(listenerObj);
    setIsConnecting(false);
    onToggleConnection();
  };
  
  const handleDisconnected = () => {
    if (listenerState?.stop) {
      listenerState.stop();
    }
    setListenerState(null);
    onToggleConnection();
  };
  
  // Clean up listener on unmount
  useEffect(() => {
    return () => {
      if (listenerState?.stop) {
        listenerState.stop();
      }
    };
  }, [listenerState]);
  
  // Handle save configuration
  const handleSaveChannelPairs = async () => {
    try {
      const success = await saveChannelPairs();
      
      // If we're connected and save was successful, update the listener with new channel pairs
      if (success && isConnected && selectedAccount) {
        // Disconnect existing listener
        if (listenerState) {
          if (listenerState.stop) {
            await listenerState.stop();
          }
        }
        
        // Setup new listener with updated channel pairs
        const listener = await setupRealtimeListener(
          selectedAccount,
          channelPairs,
          onNewMessages
        );
        
        // Convert listener to our expected format and make sure we handle the case
        // where setupRealtimeListener returns an object with only id and stop properties
        const listenerObj: ListenerState = {
          id: listener.id,
          stop: listener.stop
        };
        
        setListenerState(listenerObj);
        
        // Show success message explaining that the connection was updated
        toast({
          title: "Configuration Updated",
          description: "Channel configuration saved and connection updated automatically.",
        });
      }
    } catch (error) {
      console.error('Error saving channel pairs:', error);
      toast({
        title: "Save Failed",
        description: `Could not save channel configuration: ${error.message}`,
        variant: "destructive",
      });
    }
  };
  
  if (!selectedAccount) {
    return <EmptyChannelState />;
  }
  
  return (
    <Card className="w-full glass-card animate-slide-up">
      <CardHeader>
        <ChannelPairHeader 
          selectedAccount={selectedAccount}
          isConnected={isConnected}
          channelPairsCount={channelPairs.length}
        />
      </CardHeader>
      
      <CardContent className="space-y-6">
        <ChannelPairsList
          channelPairs={channelPairs}
          isLoading={isLoading}
          isAutoRepost={isAutoRepost}
          setIsAutoRepost={setIsAutoRepost}
          onChannelPairChange={handleChannelPairChange}
          onChannelPairRemove={removeChannelPair}
          onChannelPairAdd={addChannelPair}
        />
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <ConnectionButton
          selectedAccount={selectedAccount}
          isConnected={isConnected}
          isConnecting={isConnecting}
          channelPairs={channelPairs}
          isSaving={isSaving}
          onConnected={handleConnected}
          onDisconnected={handleDisconnected}
          onNewMessages={onNewMessages}
        />
        
        <SaveConfigButton
          isSaving={isSaving}
          isConnecting={isConnecting}
          channelPairs={channelPairs}
          onSave={handleSaveChannelPairs}
        />
      </CardFooter>
    </Card>
  );
};

export default ChannelPairManager;
