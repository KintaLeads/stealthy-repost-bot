
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw, Link, AlertTriangle } from "lucide-react";
import { ApiAccount } from "@/types/channels";
import { toast } from "@/components/ui/use-toast";
import { connectToTelegram } from "@/services/telegram";
import { setupRealtimeListener } from "@/services/telegram";
import { runConnectivityChecks } from "@/services/telegram";
import { Message } from "@/types/dashboard";
import VerificationCodeDialog from './VerificationCodeDialog';
import DiagnosticTool from '../debug/DiagnosticTool';

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
  const [showDiagnosticTool, setShowDiagnosticTool] = useState(false);
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
        
        // First check connectivity
        const projectId = "eswfrzdqxsaizkdswxfn"; // Hardcoded for now
        const connectivityResults = await runConnectivityChecks(projectId);
        
        // If there are connectivity issues, show a detailed message
        if (!connectivityResults.supabase || !connectivityResults.telegram || !connectivityResults.edgeFunction.deployed) {
          console.error("Connectivity issues detected:", connectivityResults);
          
          let errorMessage = "Connection issues detected: ";
          if (!connectivityResults.supabase) {
            errorMessage += "Cannot connect to Supabase. ";
          }
          if (!connectivityResults.telegram) {
            errorMessage += "Cannot connect to Telegram services. ";
          }
          if (!connectivityResults.edgeFunction.deployed) {
            errorMessage += "Edge Function issue: " + connectivityResults.edgeFunction.error;
          }
          
          toast({
            title: "Connection Issues",
            description: errorMessage,
            variant: "destructive",
          });
          
          // Show diagnostic tool
          setShowDiagnosticTool(true);
          return;
        }
        
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
          
          // Show diagnostic tool for connection failures
          setShowDiagnosticTool(true);
        }
      } catch (error) {
        console.error('Error connecting to Telegram:', error);
        toast({
          title: "Connection Failed",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "destructive",
        });
        
        // Show diagnostic tool for errors
        setShowDiagnosticTool(true);
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
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
        
        <Button
          variant="outline"
          onClick={() => setShowDiagnosticTool(!showDiagnosticTool)}
          className="flex items-center"
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          {showDiagnosticTool ? "Hide Diagnostics" : "Connection Diagnostics"}
        </Button>
      </div>

      {showDiagnosticTool && (
        <DiagnosticTool />
      )}

      {showVerificationDialog && tempConnectionState.account && (
        <VerificationCodeDialog
          isOpen={showVerificationDialog}
          onClose={() => setShowVerificationDialog(false)}
          account={tempConnectionState.account}
          onVerified={handleVerificationComplete}
        />
      )}
    </div>
  );
};

export default ConnectionButton;
