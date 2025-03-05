
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw, Link } from "lucide-react";
import { ApiAccount } from "@/types/channels";
import { toast } from "@/components/ui/use-toast";
import { connectToTelegram } from "@/services/telegram";
import { setupRealtimeListener } from "@/services/telegram";
import { Message } from "@/types/dashboard";
import VerificationCodeDialog from './VerificationCodeDialog';

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
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [tempConnectionState, setTempConnectionState] = useState<{
    account: ApiAccount | null
  }>({ account: null });

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
        const connectionResult = await connectToTelegram(selectedAccount);
        
        if (connectionResult.success) {
          if (connectionResult.codeNeeded) {
            // Show verification dialog
            setTempConnectionState({ account: selectedAccount });
            setShowVerificationDialog(true);
          } else {
            // Already authenticated, setup the listener
            await setupListener(selectedAccount);
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

  const setupListener = async (account: ApiAccount) => {
    try {
      // Setup the realtime listener
      const listener = await setupRealtimeListener(
        account,
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
  };

  const handleVerificationComplete = async () => {
    if (tempConnectionState.account) {
      await setupListener(tempConnectionState.account);
      setTempConnectionState({ account: null });
    }
  };

  return (
    <>
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

      {showVerificationDialog && tempConnectionState.account && (
        <VerificationCodeDialog
          isOpen={showVerificationDialog}
          onClose={() => setShowVerificationDialog(false)}
          account={tempConnectionState.account}
          onVerified={handleVerificationComplete}
        />
      )}
    </>
  );
};

export default ConnectionButton;
