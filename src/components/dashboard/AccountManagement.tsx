
import React from 'react';
import ApiAccountManager from '../ApiAccountManager';
import { ApiAccount } from '@/types/dashboard';

interface AccountManagementProps {
  onAccountSelect: (account: ApiAccount) => void;
  selectedAccountId: string | null;
  isConnected: boolean;
  isConnecting?: boolean;
  onToggleConnection: () => void;
}

const AccountManagement: React.FC<AccountManagementProps> = ({
  onAccountSelect,
  selectedAccountId,
  isConnected,
  isConnecting = false,
  onToggleConnection
}) => {
  return (
    <ApiAccountManager 
      onAccountSelect={onAccountSelect}
      selectedAccountId={selectedAccountId}
      isConnected={isConnected}
      isConnecting={isConnecting}
      onToggleConnection={onToggleConnection}
    />
  );
};

export default AccountManagement;
