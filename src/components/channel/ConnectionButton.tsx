
import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw, Link } from "lucide-react";
import { ApiAccount } from "@/types/channels";
import { toast } from "@/components/ui/use-toast";
import { connectToTelegram } from "@/services/telegram";
import { setupRealtimeListener } from "@/services/telegram";
import { Message } from "@/types/dashboard";

interface ConnectionButtonProps {
  selectedAccount: ApiAccount | null;
  isConnected: boolean;
  isConnecting: boolean;
  channelPairs: any[];
  isSaving: boolean;
  onConnected: (listener: any) => void;
  onDisconnected: () => void;
  onNewMessages: (messages: Message[]) => void;
}

const ConnectionButton: React.FC<ConnectionButtonProps> = ({
  selectedAccount,
  isConnected,
  isConnecting,
  channelPairs,
  isSaving,
  onConnected,
  onDisconnected,
  onNewMessages
}) => {
  const handleToggleConnection = async () => {
    if (!selectedAccount) {
      toast({
        title: "No Account Selected",
        description: "Please select an API account before connecting",
        variant: "destructive",
      });
      return;
    }
    
    if (isConnected) {
      // Disconnect
      onDisconnected();
      toast({
        title: "Disconnected",
        description: "Stopped listening to Telegram channels",
      });
    } else {
      try {
        // First connect to Telegram API
        const connected = await connectToTelegram(selectedAccount);
        
        if (connected) {
          // Then setup the realtime listener
          try {
            const listener = await setupRealtimeListener(
              selectedAccount,
              channelPairs,
              onNewMessages
            );
            
            onConnected(listener);
          } catch (error) {
            console.error('Error setting up realtime listener:', error);
            toast({
              title: "Listener Setup Failed",
              description: `Error: ${error.message}`,
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error('Error connecting to Telegram:', error);
        toast({
          title: "Connection Failed",
          description: `Error: ${error.message}`,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleToggleConnection}
      className="border-border hover:bg-secondary/80 transition-colors"
      disabled={isSaving || channelPairs.length === 0 || isConnecting}
    >
      {isConnecting ? (
        <>
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : isConnected ? (
        <>
          <Link className="mr-2 h-4 w-4" />
          Disconnect
        </>
      ) : (
        <>
          <Link className="mr-2 h-4 w-4" />
          Connect
        </>
      )}
    </Button>
  );
};

export default ConnectionButton;
