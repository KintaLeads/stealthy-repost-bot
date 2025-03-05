
import { useState } from 'react';
import { toast } from "@/components/ui/use-toast";
import { ApiAccount } from "@/types/channels";
import { logInfo, logError } from '@/services/telegram';
import { Message } from "@/types/dashboard";
import { useVerificationState } from './connection/useVerificationState';
import { useDiagnosticState } from './connection/useDiagnosticState';
import { setupListener, handleInitialConnection } from './connection/connectionOperations';

export const useConnectionManager = (
  selectedAccount: ApiAccount | null,
  isConnected: boolean,
  channelPairs: any[],
  onConnected: (listener: any) => void,
  onDisconnected: () => void,
  onNewMessages: (messages: Message[]) => void
) => {
  const verificationState = useVerificationState();
  const diagnosticState = useDiagnosticState();
  
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
        // Reset any previous errors
        diagnosticState.setConnectionError(null);
        
        const { codeNeeded } = await handleInitialConnection(selectedAccount);
        
        if (codeNeeded) {
          logInfo('ConnectionButton', "Verification code needed, showing dialog");
          // Show verification dialog
          verificationState.startVerification(selectedAccount);
          
          // Add a toast notification for better visibility
          toast({
            title: "Verification Required",
            description: "Please check your phone for the verification code sent by Telegram",
          });
        } else {
          logInfo('ConnectionButton', "No verification needed, setting up listener directly");
          // Already authenticated, setup the listener
          await setupListener(selectedAccount, channelPairs, onNewMessages, onConnected);
        }
      } catch (error) {
        logError('ConnectionButton', 'Error connecting to Telegram:', error);
        
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        diagnosticState.setConnectionError(errorMessage);
        
        toast({
          title: "Connection Failed",
          description: errorMessage,
          variant: "destructive",
        });
        
        // Show diagnostic tool for errors
        diagnosticState.setShowDiagnosticTool(true);
      }
    }
  };

  const handleVerificationComplete = async () => {
    if (verificationState.tempConnectionState.account) {
      logInfo('ConnectionButton', "Verification completed, setting up listener");
      try {
        await setupListener(
          verificationState.tempConnectionState.account, 
          channelPairs, 
          onNewMessages, 
          onConnected
        );
        verificationState.resetVerification();
      } catch (error) {
        // Error is already handled in setupListener
        // Just reset the verification state
        verificationState.resetVerification();
      }
    }
  };

  return {
    ...verificationState,
    ...diagnosticState,
    handleToggleConnection,
    handleVerificationComplete
  };
};
