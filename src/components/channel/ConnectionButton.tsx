
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
        console.log("Starting Telegram connection process with account:", selectedAccount.nickname);
        
        // First connect to Telegram API
        const connectionResult = await connectToTelegram(selectedAccount);
        console.log("Connection result:", connectionResult);
        
        if (connectionResult.success) {
          if (connectionResult.codeNeeded) {
            console.log("Verification code needed, showing dialog");
            // Show verification dialog
            setTempConnectionState({ account: selectedAccount });
            setShowVerificationDialog(true);
            
            // Add a toast notification for better visibility
            toast({
              title: "Verification Required",
              description: "Please check your phone for the verification code sent by Telegram",
            });
          } else {
            console.log("No verification needed, setting up listener directly");
            // Already authenticated, setup the listener
            await setupListener(selectedAccount);
          }
        } else {
          console.error("Connection failed:", connectionResult.error);
          toast({
            title: "Connection Failed",
            description: connectionResult.error || "Failed to connect to Telegram API",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error connecting to Telegram:', error);
        toast({
          title: "Connection Failed",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive",
        });
      }
    }
  };

  const setupListener = async (account: ApiAccount) => {
    try {
      console.log("Setting up realtime listener for account:", account.nickname);
      
      // Setup the realtime listener
      const listener = await setupRealtimeListener(
        account,
        channelPairs,
        onNewMessages
      );
      
      onConnected(listener);
      
      toast({
        title: "Connected",
        description: "Now listening to Telegram channels",
      });
    } catch (error) {
      console.error('Error setting up realtime listener:', error);
      toast({
        title: "Listener Setup Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const handleVerificationComplete = async () => {
    if (tempConnectionState.account) {
      console.log("Verification completed, setting up listener");
      await setupListener(tempConnectionState.account);
      setTempConnectionState({ account: null });
    }
  };

  return (
    <>
      <Button
        variant={isConnected ? "destructive" : "default"}
        onClick={handleToggleConnection}
        className={isConnected ? "" : "bg-primary text-primary-foreground hover:bg-primary/90"}
        disabled={isSaving || channelPairs.length === 0 || isConnecting || !selectedAccount}
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
            Connect to Telegram
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
