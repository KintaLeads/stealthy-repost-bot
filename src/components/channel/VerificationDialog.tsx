
import React from 'react';
import { ApiAccount } from "@/types/channels";
import VerificationCodeDialog from './VerificationCodeDialog';

interface VerificationDialogProps {
  showVerificationDialog: boolean;
  setShowVerificationDialog: (show: boolean) => void;
  tempConnectionState: { account: ApiAccount | null };
  onVerificationComplete: () => void;
}

const VerificationDialog: React.FC<VerificationDialogProps> = ({
  showVerificationDialog,
  setShowVerificationDialog,
  tempConnectionState,
  onVerificationComplete
}) => {
  if (!showVerificationDialog || !tempConnectionState.account) {
    return null;
  }

  const handleClose = () => {
    setShowVerificationDialog(false);
  };

  return (
    <VerificationCodeDialog
      isOpen={showVerificationDialog}
      onClose={handleClose}
      account={tempConnectionState.account}
      connectionResult={tempConnectionState.connectionResult || {
        codeNeeded: true,
        phoneCodeHash: '',
        success: true,
        error: null
      }}
      onVerificationSuccess={onVerificationComplete}
    />
  );
};

export default VerificationDialog;
