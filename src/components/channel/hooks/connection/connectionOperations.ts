import { ApiAccount } from "@/types/channels";
import { runConnectivityChecks, testCorsConfiguration } from "@/services/telegram/networkCheck";
import { toast } from "sonner";
import { checkRealtimeStatus } from "@/services/telegram/realtimeService";
import { connectToTelegram } from "@/services/telegram/connector";

// Export this function that was missing
export const runConnectionDiagnostics = async (selectedAccount: ApiAccount) => {
  try {
    toast.info("Running connection diagnostics...");
    
    // Get the project ID from the URL if available, otherwise use a default
    const projectId = window.location.hostname.split('.')[0] || 'your-project-id';
    
    // Run basic connectivity checks - pass the project ID
    const connectivityResult = await runConnectivityChecks(projectId);
    
    // Test CORS configuration - pass the project ID
    const corsResult = await testCorsConfiguration(projectId);
    
    return {
      connectivity: connectivityResult,
      cors: corsResult,
      timestamp: new Date(),
      account: selectedAccount
    };
  } catch (error) {
    console.error("Error running diagnostics:", error);
    toast.error("Failed to run diagnostics: " + (error instanceof Error ? error.message : String(error)));
    
    return {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date(),
      account: selectedAccount
    };
  }
};

export const checkConnectionStatus = async (accountId: string) => {
  try {
    // Call the implementation code...
    toast.info("Checking connection status...");
    
    // Check the realtime status
    const isConnected = await checkRealtimeStatus(accountId);
    
    if (isConnected) {
      toast.success("Already connected to Telegram");
    } else {
      toast.warning("Not currently connected to Telegram");
    }
    
    return isConnected; // Return the result
  } catch (error) {
    console.error("Error checking connection status:", error);
    toast.error("Failed to check status: " + (error instanceof Error ? error.message : String(error)));
    return false;
  }
};

export const testConnectionToTelegram = async (account: ApiAccount) => {
  try {
    toast.info("Testing connection to Telegram...");
    
    // Call the connectToTelegram function to test the connection
    const connectionResult = await connectToTelegram(account, {
      testOnly: true
    });
    
    if (connectionResult.success) {
      toast.success("Successfully connected to Telegram");
      return true;
    } else {
      toast.error("Failed to connect to Telegram: " + (connectionResult.error || "Unknown error"));
      return false;
    }
  } catch (error) {
    console.error("Error testing connection:", error);
    toast.error("Failed to test connection: " + (error instanceof Error ? error.message : String(error)));
    return false;
  }
};
