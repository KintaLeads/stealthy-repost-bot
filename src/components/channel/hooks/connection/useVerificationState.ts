
import { useState } from 'react';
import { ApiAccount } from "@/types/channels";
import { TempConnectionState } from '../../types';
import { ConnectionResult } from "@/services/telegram/types";

export const useVerificationState = () => {
  const [showVerificationDialog, setShowVerificationDialog] = useState(false);
  const [tempConnectionState, setTempConnectionState] = useState<TempConnectionState>({ account: null });

  const startVerification = (account: ApiAccount, connectionResult?: ConnectionResult) => {
    setTempConnectionState({ account, connectionResult });
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
