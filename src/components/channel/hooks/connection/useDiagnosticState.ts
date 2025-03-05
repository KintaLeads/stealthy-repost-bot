
import { useState } from 'react';
import { runConnectionDiagnostics } from './connectionOperations';

export const useDiagnosticState = () => {
  const [showDiagnosticTool, setShowDiagnosticTool] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const runDiagnostics = async () => {
    try {
      setShowDiagnosticTool(true);
      await runConnectionDiagnostics();
    } catch (error) {
      // Error handling is already done in runConnectionDiagnostics
      // We're just catching here to prevent the error from bubbling up
    }
  };

  return {
    showDiagnosticTool,
    setShowDiagnosticTool,
    connectionError,
    setConnectionError,
    runDiagnostics
  };
};
