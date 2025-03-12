
import { useState, useEffect } from 'react';
import { toast } from "@/components/ui/use-toast";
import { ApiAccount } from "@/types/channels";
import { logInfo, logError } from '@/services/telegram';
import { Message } from "@/types/dashboard";
import { useVerificationState } from './connection/useVerificationState';
import { useDiagnosticState } from './connection/useDiagnosticState';
import { setupListener, runConnectionDiagnostics } from './connection/connectionOperations';
import { handleInitialConnection } from '@/services/telegram/connector';
import { checkRealtimeStatus, disconnectRealtime } from '@/services/telegram/realtimeService';

export const useConnectionManager = (
  selectedAccount: ApiAccount | null,
  isConnected: boolean,
  channelPairs: any[],
  onConnected: () => void,
  onDisconnected: () => void,
  onNewMessages: (messages: Message[]) => void
) => {
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionListener, setConnectionListener] = useState<any>(null);
  
  // Custom hook for verification state
  const verificationState = useVerificationState(selectedAccount);
  
  // Custom hook for diagnostic tool state
  const { showDiagnosticTool, toggleDiagnosticTool, setShowDiagnosticTool } = useDiagnosticState();
  
  // Check connection status on mount and when selected account changes
  useEffect(() => {
    const checkCurrentStatus = async () => {
      if (isConnected && selectedAccount) {
        try {
          const status = await checkRealtimeStatus(selectedAccount);
          if (!status && connectionListener) {
            // We thought we were connected but we're not
            logInfo('ConnectionManager', 'Connection lost, cleaning up');
            if (connectionListener.stopListener) {
              connectionListener.stopListener();
            }
            setConnectionListener(null);
            onDisconnected();
          }
        } catch (error) {
          logError('ConnectionManager', 'Error checking connection status:', error);
        }
      }
    };
    
    checkCurrentStatus();
    // We only want to run this when isConnected changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, selectedAccount]);
  
  // Clear connection error when selected account changes
  useEffect(() => {
    if (selectedAccount) {
      setConnectionError(null);
    }
  }, [selectedAccount]);
  
  // Handler for toggling connection
  const handleToggleConnection = async () => {
    if (!selectedAccount) {
      toast({
        title: "Account Required",
        description: "Please select an account first",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setConnectionError(null);
      
      if (isConnected) {
        // Disconnect
        logInfo('ConnectionManager', 'Disconnecting from Telegram');
        
        if (connectionListener && connectionListener.stopListener) {
          await connectionListener.stopListener();
          setConnectionListener(null);
        }
        
        // Also call the disconnect endpoint
        await disconnectRealtime(selectedAccount);
        
        onDisconnected();
        
        toast({
          title: "Disconnected",
          description: "Telegram listener stopped",
        });
      } else {
        // Connect
        logInfo('ConnectionManager', 'Connecting to Telegram');
        
        try {
          // First check if we need verification
          const connectResult = await handleInitialConnection(selectedAccount);
          
          if (connectResult.codeNeeded) {
            logInfo('ConnectionManager', 'Verification needed, showing verification dialog');
            
            // Store temporary state for the verification dialog
            verificationState.setTempConnectionState({
              account: selectedAccount,
              connectionResult: connectResult
            });
            
            // Show verification dialog
            verificationState.showVerificationDialog();
            return;
          }
          
          // We're already verified, connect directly
          const listener = await setupListener(
            selectedAccount,
            channelPairs,
            onNewMessages,
            handleListenerConnected
          );
          
          setConnectionListener(listener);
          onConnected();
          
        } catch (error) {
          logError('ConnectionManager', 'Connection error:', error);
          
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          // Check if we need verification
          if (errorMessage.includes('Verification code needed')) {
            // Show verification dialog - but we need to get the code hash first
            logInfo('ConnectionManager', 'Verification needed, getting code hash');
            
            try {
              const connectResult = await handleInitialConnection(selectedAccount);
              
              if (connectResult.codeNeeded && connectResult.phoneCodeHash) {
                // Store temporary state for the verification dialog
                verificationState.setTempConnectionState({
                  account: selectedAccount,
                  connectionResult: connectResult
                });
                
                // Show verification dialog
                verificationState.showVerificationDialog();
              } else {
                throw new Error('Failed to get verification code. Please try again.');
              }
            } catch (verificationError) {
              logError('ConnectionManager', 'Error getting verification code:', verificationError);
              setConnectionError(verificationError instanceof Error ? verificationError.message : String(verificationError));
            }
          } else {
            setConnectionError(errorMessage);
          }
        }
      }
    } catch (error) {
      logError('ConnectionManager', 'Connection toggle error:', error);
      setConnectionError(error instanceof Error ? error.message : String(error));
    }
  };
  
  // Handler for when the listener is connected
  const handleListenerConnected = (listener: any) => {
    setConnectionListener(listener);
    onConnected();
  };
  
  // Handler for when verification is complete
  const handleVerificationComplete = () => {
    verificationState.resetVerification();
  };
  
  // Handler for verification success
  const handleVerificationSuccess = async () => {
    logInfo('ConnectionManager', 'Verification successful, connecting');
    
    try {
      // Close verification dialog
      verificationState.resetVerification();
      
      // Connect with the now-verified account
      if (selectedAccount) {
        const listener = await setupListener(
          selectedAccount,
          channelPairs,
          onNewMessages,
          handleListenerConnected
        );
        
        setConnectionListener(listener);
        onConnected();
      }
    } catch (error) {
      logError('ConnectionManager', 'Error connecting after verification:', error);
      setConnectionError(error instanceof Error ? error.message : String(error));
    }
  };
  
  return {
    verificationState,
    showDiagnosticTool,
    toggleDiagnosticTool,
    connectionError,
    handleToggleConnection,
    handleVerificationComplete,
    runDiagnostics: runConnectionDiagnostics,
    handleVerificationSuccess
  };
};
