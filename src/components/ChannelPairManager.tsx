
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Link, Check, AlertCircle } from "lucide-react";
import { ApiAccount } from "@/types/channels";
import EmptyChannelState from "./channel/EmptyChannelState";
import ChannelPairsList from "./channel/ChannelPairsList";
import { useChannelPairs } from "@/hooks/useChannelPairs";
import { connectToTelegram, setupRealtimeListener } from "@/services/telegramService";
import { toast } from "@/components/ui/use-toast";
import { Message } from "@/types/dashboard";

interface ChannelPairManagerProps {
  selectedAccount: ApiAccount | null;
  isConnected: boolean;
  onToggleConnection: () => void;
  onNewMessages?: (messages: Message[]) => void;
}

const ChannelPairManager: React.FC<ChannelPairManagerProps> = ({ 
  selectedAccount, 
  isConnected,
  onToggleConnection,
  onNewMessages = () => {}
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [listenerState, setListenerState] = useState<{ stopListener?: () => void } | null>(null);
  
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
  
  // Handle connection toggle
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
      if (listenerState && listenerState.stopListener) {
        listenerState.stopListener();
        setListenerState(null);
      }
      onToggleConnection();
      toast({
        title: "Disconnected",
        description: "Stopped listening to Telegram channels",
      });
    } else {
      // Connect
      setIsConnecting(true);
      
      try {
        // First connect to Telegram API
        const connected = await connectToTelegram(selectedAccount);
        
        if (connected) {
          // Then setup the realtime listener
          const listener = await setupRealtimeListener(
            selectedAccount,
            channelPairs,
            onNewMessages
          );
          
          setListenerState(listener);
          onToggleConnection();
        }
      } catch (error) {
        console.error('Error connecting to Telegram:', error);
        toast({
          title: "Connection Failed",
          description: `Error: ${error.message}`,
          variant: "destructive",
        });
      } finally {
        setIsConnecting(false);
      }
    }
  };
  
  // Clean up listener on unmount
  useEffect(() => {
    return () => {
      if (listenerState && listenerState.stopListener) {
        listenerState.stopListener();
      }
    };
  }, [listenerState]);
  
  // Handle auto-save when channel pairs change
  const handleSaveChannelPairs = async () => {
    try {
      const success = await saveChannelPairs();
      
      // If we're connected and save was successful, update the listener with new channel pairs
      if (success && isConnected && selectedAccount) {
        // Disconnect existing listener
        if (listenerState && listenerState.stopListener) {
          listenerState.stopListener();
        }
        
        // Setup new listener with updated channel pairs
        const listener = await setupRealtimeListener(
          selectedAccount,
          channelPairs,
          onNewMessages
        );
        
        setListenerState(listener);
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
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl flex items-center">
              <span>Channel Configuration</span>
              {isConnected && (
                <Badge className="ml-2 flex items-center gap-1.5 text-xs font-normal text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 py-0.5 px-2 rounded-full">
                  <Check size={14} />
                  <span>Connected</span>
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Configure channel pairs for <strong>{selectedAccount.nickname}</strong>
            </CardDescription>
          </div>
          <Badge variant="outline" className="px-2 py-1">
            {channelPairs.length} {channelPairs.length === 1 ? 'Pair' : 'Pairs'}
          </Badge>
        </div>
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
        
        <Button 
          onClick={handleSaveChannelPairs} 
          disabled={isSaving || channelPairs.length === 0 || isConnecting}
          className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {isSaving ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Configuration'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ChannelPairManager;
