
import { useState, useCallback } from "react";
import { ApiAccount, ChannelPair } from "@/types/channels";
import { setupRealtimeListener, disconnectRealtime, checkRealtimeStatus } from "@/services/telegram/realtimeService";
import { connectToTelegram } from "@/services/telegram/connector";
import { verifyTelegramCode } from "@/services/telegram/verifier";
import { Message } from "@/types/dashboard";
import { toast } from "sonner";

export const useConnectionManager = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [codeNeeded, setCodeNeeded] = useState(false);
  const [phoneCodeHash, setPhoneCodeHash] = useState<string | null>(null);
  const [activeListener, setActiveListener] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState<string>("");

  // Connection check on initialization
  const checkConnection = useCallback(async (accountId: string) => {
    try {
      console.log("Checking if already connected for account:", accountId);
      const status = await checkRealtimeStatus(accountId);
      setIsConnected(status);
      return status;
    } catch (error) {
      console.error("Error checking connection status:", error);
      setIsConnected(false);
      return false;
    }
  }, []);

  // Connect to Telegram
  const connect = useCallback(async (selectedAccount: ApiAccount, channelPairs: ChannelPair[], onNewMessages?: (messages: Message[]) => void) => {
    try {
      setIsConnecting(true);
      setConnectionError(null);
      
      console.log("Connecting with account:", {
        ...selectedAccount,
        apiHash: '[REDACTED]'
      });
      
      // First, connect to Telegram API
      const connectionResult = await connectToTelegram(selectedAccount, {
        debug: true
      });
      
      if (!connectionResult.success) {
        setConnectionError(connectionResult.error || "Unknown error connecting to Telegram");
        setIsConnecting(false);
        return false;
      }
      
      // If code verification is needed
      if (connectionResult.codeNeeded) {
        setCodeNeeded(true);
        setPhoneCodeHash(connectionResult.phoneCodeHash || null);
        setIsConnecting(false);
        
        // Store phoneCodeHash in localStorage for later use
        if (connectionResult.phoneCodeHash) {
          localStorage.setItem(`telegram_code_hash_${selectedAccount.id}`, connectionResult.phoneCodeHash);
        }
        
        return 'verification_needed';
      }
      
      // If we're already authenticated, set up the realtime listener
      const listener = await setupRealtimeListener(
        selectedAccount,
        channelPairs,
        onNewMessages
      );
      
      setActiveListener(listener);
      setIsConnected(true);
      setIsConnecting(false);
      
      return true;
    } catch (error) {
      console.error("Error connecting:", error);
      setConnectionError(error instanceof Error ? error.message : String(error));
      setIsConnecting(false);
      return false;
    }
  }, []);

  // Verify code
  const verifyCode = useCallback(async (account: ApiAccount, code: string) => {
    try {
      setIsConnecting(true);
      
      // Get the stored phoneCodeHash
      const storedPhoneCodeHash = phoneCodeHash || localStorage.getItem(`telegram_code_hash_${account.id}`);
      
      if (!storedPhoneCodeHash) {
        throw new Error("Missing verification code hash. Please try connecting again.");
      }
      
      const result = await verifyTelegramCode(account, code, {
        phoneCodeHash: storedPhoneCodeHash
      });
      
      // Clear verification state
      setCodeNeeded(false);
      setPhoneCodeHash(null);
      setIsConnecting(false);
      
      return result;
    } catch (error) {
      console.error("Error verifying code:", error);
      setConnectionError(error instanceof Error ? error.message : String(error));
      setIsConnecting(false);
      return false;
    }
  }, [phoneCodeHash]);

  // Disconnect from Telegram
  const disconnect = useCallback(async (account: ApiAccount) => {
    try {
      setIsConnecting(true);
      
      if (activeListener) {
        // If we have an active listener with a stop method, call it
        if (activeListener.stop) {
          await activeListener.stop();
        }
        setActiveListener(null);
      }
      
      // Also call the disconnectRealtime function for a complete disconnection
      const result = await disconnectRealtime(account.id);
      
      setIsConnected(false);
      setIsConnecting(false);
      
      return result;
    } catch (error) {
      console.error("Error disconnecting:", error);
      setConnectionError(error instanceof Error ? error.message : String(error));
      setIsConnecting(false);
      return false;
    }
  }, [activeListener]);

  return {
    isConnecting,
    isConnected,
    connectionError,
    codeNeeded,
    phoneCodeHash,
    activeListener,
    verificationCode,
    setVerificationCode,
    connect,
    disconnect,
    verifyCode,
    checkConnection
  };
};
