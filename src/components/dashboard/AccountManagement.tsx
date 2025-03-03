
import React from 'react';
import ApiAccountManager from '../ApiAccountManager';

interface ApiAccount {
  id: string;
  nickname: string;
  apiKey: string;
  apiHash: string;
  phoneNumber: string;
}

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
