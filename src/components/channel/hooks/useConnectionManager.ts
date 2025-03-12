
import { useState, useEffect } from 'react';
import { ApiAccount, ChannelPair } from '@/types/channels';
import { Message } from '@/types/dashboard';
import { disconnectRealtime, setupRealtimeListener } from '@/services/telegram/realtimeService';
import { verifyTelegramCode } from '@/services/telegram/verifier';
import { validateTelegramCredentials } from '@/services/telegram/credentialValidator';
import { checkConnectionStatus, initiateConnection, disconnectConnection } from './connection/connectionOperations';

export const useConnectionManager = (
  selectedAccount: ApiAccount | null,
  channelPairs: ChannelPair[]
) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check connection status on mount and when account changes
  useEffect(() => {
    const checkStatus = async () => {
      if (selectedAccount?.id) {
        const status = await checkConnectionStatus(selectedAccount);
        setIsConnected(status);
      } else {
        setIsConnected(false);
      }
    };

    checkStatus();
  }, [selectedAccount]);

  const handleConnect = async () => {
    if (!selectedAccount) return;
    
    setIsConnecting(true);
    setError(null);

    try {
      // Validate credentials first
      const isValid = await validateTelegramCredentials({
        apiId: selectedAccount.apiKey, // Use apiKey instead of apiId
        apiHash: selectedAccount.apiHash,
        phoneNumber: selectedAccount.phoneNumber
      });

      if (!isValid) {
        setError('Invalid Telegram credentials');
        return;
      }

      const result = await initiateConnection(
        selectedAccount,
        channelPairs,
        (messages: Message[]) => {
          console.log('New messages received:', messages);
          // Handle new messages here
        }
      );

      setIsConnected(result);
    } catch (error) {
      console.error('Connection error:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!selectedAccount) return;
    
    setIsConnecting(true);
    setError(null);

    try {
      // Fix: pass the full account object, not just the ID
      const result = await disconnectConnection(selectedAccount);
      setIsConnected(!result);
    } catch (error) {
      console.error('Disconnect error:', error);
      setError(error instanceof Error ? error.message : 'Failed to disconnect');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleVerificationCode = async (code: string) => {
    if (!selectedAccount) return;
    
    try {
      const result = await verifyTelegramCode(selectedAccount.id, code);
      if (result.success) {
        setShowVerification(false);
        handleConnect(); // Retry connection after verification
      } else {
        setError('Invalid verification code');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError(error instanceof Error ? error.message : 'Verification failed');
    }
  };

  return {
    isConnected,
    isConnecting,
    showVerification,
    error,
    handleConnect,
    handleDisconnect,
    handleVerificationCode
  };
};

export default useConnectionManager;
