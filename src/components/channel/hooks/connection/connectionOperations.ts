
import { toast } from "@/components/ui/use-toast";
import { ApiAccount } from "@/types/channels";
import { connectToTelegram, setupRealtimeListener, runConnectivityChecks, testCorsConfiguration } from "@/services/telegram";
import { logInfo, logError } from '@/services/telegram';
import { Message } from "@/types/dashboard";

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
    
    toast({
      title: "Listener Setup Failed",
      description: errorMessage,
      variant: "destructive",
    });

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

export const handleInitialConnection = async (selectedAccount: ApiAccount) => {
  logInfo('ConnectionButton', "Starting Telegram connection process with account:", selectedAccount.nickname);
  
  // First check connectivity
  const connectivityResults = await runConnectivityChecks(PROJECT_ID);
  
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
    
    // If Edge Function is deployed but we're having issues, test CORS
    if (connectivityResults.edgeFunction.deployed && connectivityResults.edgeFunction.error) {
      logInfo('ConnectionButton', "Testing CORS configuration...");
      const corsTest = await testCorsConfiguration(PROJECT_ID);
      logInfo('ConnectionButton', "CORS test results:", corsTest);
      
      if (!corsTest.success) {
        toast({
          title: "CORS Configuration Issue",
          description: "There may be a CORS configuration issue with the Edge Function. This is a server-side problem that requires administrator attention.",
          variant: "destructive",
        });
      }
    }
    
    throw new Error(errorMessage);
  }
  
  // First connect to Telegram API
  logInfo('ConnectionButton', "Attempting to connect to Telegram with account:", selectedAccount.nickname);
  const connectionResult = await connectToTelegram(selectedAccount);
  logInfo('ConnectionButton', "Connection result:", connectionResult);
  
  if (!connectionResult.success) {
    logError('ConnectionButton', "Connection failed:", connectionResult.error);
    throw new Error(connectionResult.error || "Unknown connection error");
  }
  
  return { 
    codeNeeded: connectionResult.codeNeeded 
  };
};
