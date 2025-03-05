
import { useState } from 'react';
import { ApiAccount } from "@/types/channels";
import { TempConnectionState } from '../../types';

export const useVerificationState = () => {
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [tempConnectionState, setTempConnectionState] = useState<TempConnectionState>({ account: null });

  const startVerification = (account: ApiAccount) => {
    setTempConnectionState({ account });
    setShowVerificationDialog(true);
  };

  const resetVerification = () => {
    setTempConnectionState({ account: null });
    setShowVerificationDialog(false);
  };

  return {
    showVerificationDialog,
    setShowVerificationDialog,
    tempConnectionState,
    startVerification,
    resetVerification
  };
};
