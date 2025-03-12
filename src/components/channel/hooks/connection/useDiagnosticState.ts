
import { useState } from 'react';
import { runConnectionDiagnostics } from './connectionOperations';
import { ApiAccount } from '@/types/channels';

export const useDiagnosticState = () => {
  const [showDiagnosticTool, setShowDiagnosticTool] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<ApiAccount | null>(null);

  const toggleDiagnosticTool = () => {
    setShowDiagnosticTool(prev => !prev);
  };

  const runDiagnostics = async (account: ApiAccount) => {
    try {
      setShowDiagnosticTool(true);
      setSelectedAccount(account);
      // Now pass the account to runConnectionDiagnostics
      await runConnectionDiagnostics(account);
    } catch (error) {
      // Error handling is already done in runConnectionDiagnostics
      // We're just catching here to prevent the error from bubbling up
    }
  };

  return {
    showDiagnosticTool,
    setShowDiagnosticTool,
    toggleDiagnosticTool,
    connectionError,
    setConnectionError,
    runDiagnostics,
    selectedAccount
  };
};
