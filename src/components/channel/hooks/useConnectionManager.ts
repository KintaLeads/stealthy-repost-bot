
import { useState } from 'react';
import { toast } from "@/components/ui/use-toast";
import { ApiAccount } from "@/types/channels";
import { connectToTelegram, setupRealtimeListener, runConnectivityChecks, testCorsConfiguration } from "@/services/telegram";
import { logInfo, logError } from '@/services/telegram';
import { Message } from "@/types/dashboard";
import { TempConnectionState } from '../types';

export const useConnectionManager = (
  selectedAccount: ApiAccount | null,
  isConnected: boolean,
  channelPairs: any[],
  onConnected: (listener: any) => void,
  onDisconnected: () => void,
  onNewMessages: (messages: Message[]) => void
) => {
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [showDiagnosticTool, setShowDiagnosticTool] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [tempConnectionState, setTempConnectionState] = useState<TempConnectionState>({ account: null });

  const setupListener = async (account: ApiAccount) => {
    try {
      logInfo('ConnectionButton', "Setting up realtime listener for account:", account.nickname);
      
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
      logError('ConnectionButton', 'Error setting up realtime listener:', error);
      
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      setConnectionError(errorMessage);
      
      toast({
        title: "Listener Setup Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

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
        setConnectionError(null);
        
        logInfo('ConnectionButton', "Starting Telegram connection process with account:", selectedAccount.nickname);
        
        // First check connectivity
        const projectId = "eswfrzdqxsaizkdswxfn"; // Hardcoded for now
        const connectivityResults = await runConnectivityChecks(projectId);
        
        // If there are connectivity issues, show a detailed message
        if (!connectivityResults.supabase || !connectivityResults.telegram || !connectivityResults.edgeFunction.deployed) {
          logError('ConnectionButton', "Connectivity issues detected:", connectivityResults);
          
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
          
          setConnectionError(errorMessage);
          
          toast({
            title: "Connection Issues",
            description: errorMessage,
            variant: "destructive",
          });
          
          // Show diagnostic tool
          setShowDiagnosticTool(true);
          
          // If Edge Function is deployed but we're having issues, test CORS
          if (connectivityResults.edgeFunction.deployed && connectivityResults.edgeFunction.error) {
            logInfo('ConnectionButton', "Testing CORS configuration...");
            const corsTest = await testCorsConfiguration(projectId);
            logInfo('ConnectionButton', "CORS test results:", corsTest);
            
            if (!corsTest.success) {
              toast({
                title: "CORS Configuration Issue",
                description: "There may be a CORS configuration issue with the Edge Function. This is a server-side problem that requires administrator attention.",
                variant: "destructive",
              });
            }
          }
          
          return;
        }
        
        // First connect to Telegram API
        logInfo('ConnectionButton', "Attempting to connect to Telegram with account:", selectedAccount.nickname);
        const connectionResult = await connectToTelegram(selectedAccount);
        logInfo('ConnectionButton', "Connection result:", connectionResult);
        
        if (connectionResult.success) {
          if (connectionResult.codeNeeded) {
            logInfo('ConnectionButton', "Verification code needed, showing dialog");
            // Show verification dialog
            setTempConnectionState({ account: selectedAccount });
            setShowVerificationDialog(true);
            
            // Add a toast notification for better visibility
            toast({
              title: "Verification Required",
              description: "Please check your phone for the verification code sent by Telegram",
            });
          } else {
            logInfo('ConnectionButton', "No verification needed, setting up listener directly");
            // Already authenticated, setup the listener
            await setupListener(selectedAccount);
          }
        } else {
          logError('ConnectionButton', "Connection failed:", connectionResult.error);
          setConnectionError(connectionResult.error || "Unknown connection error");
          
          toast({
            title: "Connection Failed",
            description: connectionResult.error || "Failed to connect to Telegram API",
            variant: "destructive",
          });
          
          // Show diagnostic tool for connection failures
          setShowDiagnosticTool(true);
        }
      } catch (error) {
        logError('ConnectionButton', 'Error connecting to Telegram:', error);
        
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
        setConnectionError(errorMessage);
        
        toast({
          title: "Connection Failed",
          description: errorMessage,
          variant: "destructive",
        });
        
        // Show diagnostic tool for errors
        setShowDiagnosticTool(true);
      }
    }
  };

  const handleVerificationComplete = async () => {
    if (tempConnectionState.account) {
      logInfo('ConnectionButton', "Verification completed, setting up listener");
      await setupListener(tempConnectionState.account);
      setTempConnectionState({ account: null });
    }
  };

  const runDiagnostics = async () => {
    try {
      setShowDiagnosticTool(true);
      const projectId = "eswfrzdqxsaizkdswxfn";
      
      // Run both connectivity and CORS checks
      const connectivityResults = await runConnectivityChecks(projectId);
      const corsResults = await testCorsConfiguration(projectId);
      
      logInfo('ConnectionButton', "Diagnostics completed", {
        connectivity: connectivityResults,
        cors: corsResults
      });
      
      toast({
        title: "Diagnostics Completed",
        description: "Check the diagnostic tool for results",
      });
    } catch (error) {
      logError('ConnectionButton', "Error running diagnostics", error);
      
      toast({
        title: "Diagnostics Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  return {
    showVerificationDialog,
    setShowVerificationDialog,
    showDiagnosticTool,
    connectionError,
    tempConnectionState,
    handleToggleConnection,
    handleVerificationComplete,
    runDiagnostics
  };
};
