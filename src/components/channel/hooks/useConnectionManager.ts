
import { useState } from 'react';
import { toast } from "@/components/ui/use-toast";
import { ApiAccount } from "@/types/channels";
import { logInfo, logError } from '@/services/telegram';
import { Message } from "@/types/dashboard";
import { useVerificationState } from './connection/useVerificationState';
import { useDiagnosticState } from './connection/useDiagnosticState';
import { setupListener } from './connection/connectionOperations';
import { handleInitialConnection } from '@/services/telegram/connector';

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
        
        logInfo('ConnectionButton', `Attempting to connect Telegram account: ${selectedAccount.nickname} (${selectedAccount.phoneNumber})`);
        
        const connectionResult = await handleInitialConnection(selectedAccount);
        
        if (connectionResult.codeNeeded) {
          logInfo('ConnectionButton', "Verification code needed, showing dialog");
          // Show verification dialog with connection result
          verificationState.startVerification(selectedAccount, connectionResult);
          
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
        
        // Check if the error message indicates we need verification
        if (errorMessage.includes('verification code') || errorMessage.includes('code needed')) {
          logInfo('ConnectionButton', "Verification code needed based on error message, showing dialog");
          verificationState.startVerification(selectedAccount);
          
          toast({
            title: "Verification Required",
            description: "Please enter the verification code sent to your Telegram account",
          });
        } else {
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
        logError('ConnectionButton', "Error setting up listener after verification:", error);
        verificationState.resetVerification();
        
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        diagnosticState.setConnectionError(errorMessage);
        
        toast({
          title: "Connection Failed After Verification",
          description: errorMessage,
          variant: "destructive",
        });
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
