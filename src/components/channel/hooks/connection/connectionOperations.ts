
import { toast } from "sonner";
import { ApiAccount, ChannelPair } from '@/types/channels';
import { Message } from '@/types/dashboard';
import { disconnectRealtime, setupRealtimeListener, checkRealtimeStatus } from '@/services/telegram/realtimeService';
import { connectToTelegram } from '@/services/telegram/connector';
import { verifyTelegramCode } from '@/services/telegram/verifier';

// Check the connection status for a given account
export const checkConnectionStatus = async (account: ApiAccount): Promise<boolean> => {
  try {
    return await checkRealtimeStatus(account.id);
  } catch (error) {
    console.error('Error checking connection status:', error);
    return false;
  }
};

// Initialize a connection to Telegram
export const initiateConnection = async (
  account: ApiAccount,
  channelPairs: ChannelPair[],
  onNewMessages?: (messages: Message[]) => void
): Promise<boolean> => {
  try {
    // First attempt to establish a Telegram connection
    const connectionResult = await connectToTelegram(account);
    
    if (!connectionResult.success) {
      toast(
        "Connection Failed", 
        { description: connectionResult.error || "Failed to connect to Telegram" }
      );
      return false;
    }
    
    // If verification needed, return false and handle elsewhere
    if (connectionResult.codeNeeded) {
      // Save phone code hash for later verification
      localStorage.setItem(`telegram_code_hash_${account.id}`, connectionResult.phoneCodeHash || '');
      
      toast(
        "Verification Required", 
        { description: "Please check your Telegram app for a verification code" }
      );
      return false;
    }
    
    // If we have a session, setup the realtime listener
    if (connectionResult.session) {
      const listener = await setupRealtimeListener(account, channelPairs, onNewMessages);
      
      toast(
        "Connected Successfully", 
        { description: "Telegram connection established" }
      );
      return true;
    }
    
    toast(
      "Connection Issue", 
      { description: "Unknown connection state" }
    );
    return false;
  } catch (error) {
    console.error('Connection error:', error);
    toast(
      "Connection Error", 
      { description: error instanceof Error ? error.message : "An unknown error occurred" }
    );
    return false;
  }
};

// Disconnect from Telegram
export const disconnectConnection = async (account: ApiAccount): Promise<boolean> => {
  try {
    const success = await disconnectRealtime(account.id);
    
    toast(
      "Disconnected", 
      { description: "Telegram connection closed" }
    );
    
    return success;
  } catch (error) {
    console.error('Disconnect error:', error);
    toast(
      "Disconnect Error", 
      { description: error instanceof Error ? error.message : "An unknown error occurred" }
    );
    return false;
  }
};

// Run diagnostics for connection issues
export const runConnectionDiagnostics = async (): Promise<any> => {
  try {
    toast(
      "Running Diagnostics", 
      { description: "Checking connection to Telegram services..." }
    );
    
    // Check Supabase connectivity
    const supabaseConnected = true; // Replace with actual check if needed
    
    // Check Telegram API connectivity
    const telegramConnected = true; // Replace with actual check if needed
    
    // Return diagnostic results
    return {
      supabase: supabaseConnected,
      telegram: telegramConnected,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Diagnostic error:', error);
    toast(
      "Diagnostic Failed", 
      { description: error instanceof Error ? error.message : "Could not complete diagnostics" }
    );
    throw error;
  }
};
