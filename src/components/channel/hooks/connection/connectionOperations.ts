
import { toast } from "@/components/ui/use-toast";
import { ApiAccount } from "@/types/channels";
import { setupRealtimeListener } from "@/services/telegram";
import { logInfo, logError } from '@/services/telegram';
import { Message } from "@/types/dashboard";
import { runConnectivityChecks, testCorsConfiguration } from "@/services/telegram/networkCheck";

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
