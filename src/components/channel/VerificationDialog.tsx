
import React, { useState } from 'react';
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

  return (
    <VerificationCodeDialog
      isOpen={showVerificationDialog}
      onClose={() => setShowVerificationDialog(false)}
      account={tempConnectionState.account}
      onVerified={onVerificationComplete}
    />
  );
};

export default VerificationDialog;
