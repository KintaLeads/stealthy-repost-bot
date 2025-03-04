
import { useEffect } from 'react';
import { ApiAccount } from '@/types/dashboard';
import { useApiAccountsList } from './useApiAccountsList';
import { useApiAccountOperations } from './useApiAccountOperations';

export const useApiAccounts = (selectedAccountId: string | null, onAccountSelect: (account: ApiAccount | null) => void) => {
  const { 
    accounts, 
    setAccounts, 
    isLoading, 
    fetchApiAccounts 
  } = useApiAccountsList(selectedAccountId);
  
  const {
    isSaving,
    handleCreateAccount,
    handleUpdateAccount,
    handleDeleteAccount,
    handleSelectAccount
  } = useApiAccountOperations(accounts, setAccounts, onAccountSelect);
  
  // If there's no selected account yet but we have accounts, select the first one
  useEffect(() => {
    if (!selectedAccountId && accounts.length > 0) {
      onAccountSelect(accounts[0]);
    }
  }, [accounts, selectedAccountId, onAccountSelect]);

  return {
    accounts,
    isLoading,
    isSaving,
    handleCreateAccount,
    handleUpdateAccount,
    handleDeleteAccount,
    handleSelectAccount
  };
};
