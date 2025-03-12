
import { useState, useEffect, useCallback } from 'react';
import { toast } from "@/components/ui/use-toast";
import { ApiAccount } from "@/types/channels";
import { logInfo, logError, hasStoredSession, storeSession } from '@/services/telegram';
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
  onConnected: (listener: any) => void,
  onDisconnected: () => void,
  onNewMessages: (messages: Message[]) => void
) => {
  // All useState hooks must be called unconditionally at the top
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionListener, setConnectionListener] = useState<any>(null);
  
  // Custom hook for verification state
  const verificationState = useVerificationState();
  
  // Custom hook for diagnostic tool state
  const { showDiagnosticTool, toggleDiagnosticTool } = useDiagnosticState();
  
  // Define all callback functions before useEffect hooks
  const handleListenerConnected = useCallback((listener: any) => {
    setConnectionListener(listener);
    onConnected(listener);
  }, [onConnected]);
  
  const handleVerificationComplete = useCallback(() => {
    verificationState.resetVerification();
  }, [verificationState]);
  
  const handleVerificationSuccess = useCallback(async () => {
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
        onConnected(listener);
      }
    } catch (error) {
      logError('ConnectionManager', 'Error connecting after verification:', error);
      setConnectionError(error instanceof Error ? error.message : String(error));
    }
  }, [selectedAccount, channelPairs, onNewMessages, onConnected, verificationState, handleListenerConnected]);
  
  const handleToggleConnection = useCallback(async () => {
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
          // First check if we need verification - THIS CALLS TELEGRAM-CONNECTOR
          logInfo('ConnectionManager', 'Calling handleInitialConnection with account:', 
            selectedAccount.nickname || selectedAccount.phoneNumber);
            
          const connectResult = await handleInitialConnection(selectedAccount, {
            debug: true, // Enable debug mode to get more logs
            logLevel: 'verbose'
          });
          
          logInfo('ConnectionManager', 'Initial connection result:', connectResult);
          
          if (connectResult.codeNeeded) {
            logInfo('ConnectionManager', 'Verification needed, showing verification dialog');
            
            // Store temporary state for the verification dialog
            verificationState.startVerification(selectedAccount, connectResult);
            
            return;
          }
          
          // Store the session if we got one
          if (connectResult.session) {
            logInfo('ConnectionManager', 'Got session, storing it');
            storeSession(selectedAccount.id, connectResult.session);
          }
          
          // We're already verified, connect directly
          const listener = await setupListener(
            selectedAccount,
            channelPairs,
            onNewMessages,
            handleListenerConnected
          );
          
          setConnectionListener(listener);
          onConnected(listener);
          
        } catch (error) {
          logError('ConnectionManager', 'Connection error:', error);
          
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          // Check if we need verification
          if (errorMessage.includes('Verification code needed')) {
            // Show verification dialog - but we need to get the code hash first
            logInfo('ConnectionManager', 'Verification needed, getting code hash');
            
            try {
              const connectResult = await handleInitialConnection(selectedAccount, {
                debug: true,
                logLevel: 'verbose'
              });
              
              if (connectResult.codeNeeded && connectResult.phoneCodeHash) {
                // Store temporary state for the verification dialog
                verificationState.startVerification(selectedAccount, connectResult);
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
  }, [selectedAccount, isConnected, connectionListener, channelPairs, onNewMessages, onConnected, onDisconnected, verificationState, handleListenerConnected]);
  
  // Check for existing session on mount and account change
  useEffect(() => {
    if (selectedAccount?.id && !isConnected) {
      const hasSession = hasStoredSession(selectedAccount.id);
      
      if (hasSession) {
        logInfo('ConnectionManager', `Found existing session for account ${selectedAccount.id}, attempting to reconnect`);
        handleToggleConnection();
      }
    }
  }, [selectedAccount?.id, isConnected, handleToggleConnection]);
  
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
  }, [isConnected, selectedAccount, connectionListener, onDisconnected]);
  
  // Clear connection error when selected account changes
  useEffect(() => {
    if (selectedAccount) {
      setConnectionError(null);
    }
  }, [selectedAccount]);
  
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
