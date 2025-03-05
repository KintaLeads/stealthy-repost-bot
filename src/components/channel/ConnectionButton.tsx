
import React, { useState } from 'react';
import { ApiAccount } from "@/types/channels";
import { Message } from "@/types/dashboard";
import VerificationCodeDialog from './VerificationCodeDialog';
import DiagnosticTool from '../debug/DiagnosticTool';
import ConnectionToggleButton from './ConnectionToggleButton';
import DiagnosticActions from './DiagnosticActions';
import ConnectionErrorDisplay from './ConnectionErrorDisplay';
import { useConnectionManager } from './hooks/useConnectionManager';
import { ConnectionButtonProps } from './types';

const ConnectionButton: React.FC<ConnectionButtonProps> = ({
  selectedAccount,
  isConnected,
  isConnecting,
  channelPairs,
  isSaving,
  onConnected,
  onDisconnected,
  onNewMessages
}) => {
  const {
    showVerificationDialog,
    setShowVerificationDialog,
    showDiagnosticTool,
    connectionError,
    tempConnectionState,
    handleToggleConnection,
    handleVerificationComplete,
    runDiagnostics
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
      
      <div className="flex flex-col sm:flex-row gap-2">
        <ConnectionToggleButton
          isConnected={isConnected}
          isConnecting={isConnecting}
          isDisabled={isSaving || channelPairs.length === 0 || isConnecting || !selectedAccount}
          onToggle={handleToggleConnection}
        />
        
        <DiagnosticActions
          showDiagnosticTool={showDiagnosticTool}
          runDiagnostics={runDiagnostics}
        />
      </div>

      {showDiagnosticTool && (
        <DiagnosticTool />
      )}

      {showVerificationDialog && tempConnectionState.account && (
        <VerificationCodeDialog
          isOpen={showVerificationDialog}
          onClose={() => setShowVerificationDialog(false)}
          account={tempConnectionState.account}
          onVerified={handleVerificationComplete}
        />
      )}
    </div>
  );
};

export default ConnectionButton;
