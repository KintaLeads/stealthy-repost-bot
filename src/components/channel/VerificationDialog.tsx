
import React from 'react';
import { ApiAccount } from '@/types/channels';
import VerificationCodeDialog from './VerificationCodeDialog';
import { TempConnectionState } from './types';

interface VerificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  state: TempConnectionState;
  onVerificationSuccess: () => void;
}

const VerificationDialog: React.FC<VerificationDialogProps> = ({
  isOpen,
  onClose,
  state,
  onVerificationSuccess
}) => {
  return (
    <VerificationCodeDialog
      isOpen={isOpen}
      onClose={onClose}
      account={state.account}
      connectionResult={state.connectionResult}
      onVerificationSuccess={onVerificationSuccess}
    />
  );
};

export default VerificationDialog;
