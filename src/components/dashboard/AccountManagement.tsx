
import React from 'react';
import ApiAccountManager from '../ApiAccountManager';
import { ApiAccount } from '@/types/channels';

interface AccountManagementProps {
  onAccountSelect: (account: ApiAccount) => void;
  selectedAccountId: string | null;
}

const AccountManagement: React.FC<AccountManagementProps> = ({
  onAccountSelect,
  selectedAccountId
}) => {
  return (
    <ApiAccountManager 
      onAccountSelect={onAccountSelect}
      selectedAccountId={selectedAccountId}
    />
  );
};

export default AccountManagement;
