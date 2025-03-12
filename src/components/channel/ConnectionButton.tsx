
import React from 'react';
import DiagnosticActions from './DiagnosticActions';
import ConnectionErrorDisplay from './ConnectionErrorDisplay';
import DiagnosticToolSection from './DiagnosticToolSection';
import VerificationDialog from './VerificationDialog';
import ConnectionToggleButton from './ConnectionToggleButton';
import { useConnectionManager } from './hooks/useConnectionManager';
import { ConnectionButtonProps } from './types';

export const ConnectionButton = ({
  selectedAccount,
  isConnected,
  isConnecting,
  channelPairs,
  isSaving,
  onConnected,
  onDisconnected,
  onNewMessages,
}: ConnectionButtonProps) => {
  const {
    verificationState,
    showDiagnosticTool,
    toggleDiagnosticTool,
    connectionError,
    handleToggleConnection,
    handleVerificationComplete,
    runDiagnostics,
    handleVerificationSuccess
  } = useConnectionManager(
    selectedAccount,
    isConnected,
    channelPairs,
    onConnected,
    onDisconnected,
    onNewMessages
  );

  return (
    <div className="space-y-4">
      <ConnectionErrorDisplay error={connectionError} />
      
      <div className="flex flex-col sm:flex-row gap-2 justify-between items-center">
        <ConnectionToggleButton
          isConnected={isConnected}
          isConnecting={isConnecting}
          isDisabled={isSaving || !selectedAccount}
          onToggle={handleToggleConnection}
        />
        
        <DiagnosticActions
          showDiagnosticTool={showDiagnosticTool}
          runDiagnostics={runDiagnostics}
        />
      </div>

      <DiagnosticToolSection showDiagnosticTool={showDiagnosticTool} />
      
      <VerificationDialog
        isOpen={verificationState.showVerificationDialog}
        onClose={verificationState.resetVerification}
        state={verificationState.tempConnectionState}
        onVerificationSuccess={handleVerificationSuccess}
      />
    </div>
  );
};

export default ConnectionButton;
