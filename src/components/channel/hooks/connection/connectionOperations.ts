
import { toast } from "@/components/ui/use-toast";
import { ApiAccount } from "@/types/channels";
import { setupRealtimeListener } from "@/services/telegram";
import { logInfo, logError } from '@/services/telegram';
import { Message } from "@/types/dashboard";
import { runConnectivityChecks, testCorsConfiguration } from "@/services/telegram/networkCheck";
import { handleInitialConnection } from "@/services/telegram/connector";
import { ConnectionResult } from "@/services/telegram/types";

// The project ID is hardcoded for now
const PROJECT_ID = "eswfrzdqxsaizkdswxfn";

export const setupListener = async (
  account: ApiAccount,
  channelPairs: any[],
  onNewMessages: (messages: Message[]) => void,
  onConnected: (listener: any) => void
) => {
  try {
    logInfo('ConnectionButton', "Setting up realtime listener for account:", account.nickname);
    
    // First check if we need to authenticate
    const connectResult = await handleInitialConnection(account) as ConnectionResult;
    if (!connectResult.success) {
      logError('ConnectionButton', 'Connection failed:', connectResult.error);
      throw new Error(connectResult.error || 'Failed to connect to Telegram');
    }
    
    if (connectResult.codeNeeded) {
      logInfo('ConnectionButton', "Verification code needed");
      throw new Error('Verification code needed. Please verify your account first.');
    }
    
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
    
    // Check if we need authentication
    if (errorMessage.includes('Not authenticated') || 
        errorMessage.includes('Authentication required') ||
        errorMessage.includes('Verification code needed')) {
      throw new Error('Verification code needed. Please verify your account first.');
    } else {
      toast({
        title: "Listener Setup Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }

    throw error; // Re-throw to be handled by the calling function
  }
};

export const runConnectionDiagnostics = async () => {
  try {
    // Run both connectivity and CORS checks
    const connectivityResults = await runConnectivityChecks(PROJECT_ID);
    const corsResults = await testCorsConfiguration(PROJECT_ID);
    
    logInfo('ConnectionButton', "Diagnostics completed", {
      connectivity: connectivityResults,
      cors: corsResults
    });
    
    toast({
      title: "Diagnostics Completed",
      description: "Check the diagnostic tool for results",
    });

    return { connectivityResults, corsResults };
  } catch (error) {
    logError('ConnectionButton', "Error running diagnostics", error);
    
    toast({
      title: "Diagnostics Failed",
      description: error instanceof Error ? error.message : "An unknown error occurred",
      variant: "destructive",
    });

    throw error;
  }
};
