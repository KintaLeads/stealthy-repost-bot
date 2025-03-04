
import { useState } from 'react';
import { ApiAccount } from '@/types/dashboard';
import { useAuth } from './useAuth';
import { 
  createApiAccountInDb, 
  updateApiAccountInDb, 
  deleteApiAccountFromDb,
  validateAccount,
  formatApiAccount
} from '@/utils/apiAccountUtils';
import { toast } from "@/components/ui/use-toast";

export const useApiAccountOperations = (
  accounts: ApiAccount[],
  setAccounts: React.Dispatch<React.SetStateAction<ApiAccount[]>>,
  onAccountSelect: (account: ApiAccount | null) => void
) => {
  const [isSaving, setIsSaving] = useState(false);
  const { userId } = useAuth();
  
  const handleCreateAccount = async (newAccount: ApiAccount) => {
    try {
      if (!validateAccount(newAccount)) return false;
      
      setIsSaving(true);
      
      if (!userId) {
        toast({
          title: "Authentication required",
          description: "Please log in to create API accounts",
          variant: "destructive",
        });
        return false;
      }
      
      const data = await createApiAccountInDb(userId, newAccount);
      
      if (data) {
        const createdAccount = formatApiAccount(data);
        createdAccount.isActive = true;
        
        setAccounts(prev => [...prev, createdAccount]);
        
        // Select the newly created account
        onAccountSelect(createdAccount);
        
        toast({
          title: "Account created",
          description: `API account "${data.api_name}" has been created successfully`,
        });
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error creating API account:', error);
      toast({
        title: "Failed to create account",
        description: error.message || "Could not create your API account",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleUpdateAccount = async (account: ApiAccount) => {
    try {
      if (!validateAccount(account)) return false;
      
      setIsSaving(true);
      
      await updateApiAccountInDb(account.id, account);
      
      // Update local state
      setAccounts(prev => 
        prev.map(acc => acc.id === account.id ? { ...account, isActive: true } : acc)
      );
      
      // Select the updated account
      onAccountSelect(account);
      
      toast({
        title: "Account updated",
        description: `API account "${account.nickname}" has been updated successfully`,
      });
      
      return true;
    } catch (error) {
      console.error('Error updating API account:', error);
      toast({
        title: "Failed to update account",
        description: error.message || "Could not update your API account",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDeleteAccount = async (accountId: string) => {
    try {
      // Find the account to be deleted
      const accountToDelete = accounts.find(acc => acc.id === accountId);
      
      if (!accountToDelete) return false;
      
      // Ask for confirmation
      if (!window.confirm(`Are you sure you want to delete the API account "${accountToDelete.nickname}"? This action cannot be undone.`)) {
        return false;
      }
      
      setIsSaving(true);
      
      await deleteApiAccountFromDb(accountId);
      
      // Update local state
      const updatedAccounts = accounts.filter(acc => acc.id !== accountId);
      setAccounts(updatedAccounts);
      
      // If we deleted the selected account, select another one if available
      if (accountToDelete.isActive && updatedAccounts.length > 0) {
        onAccountSelect(updatedAccounts[0]);
      } else if (updatedAccounts.length === 0) {
        onAccountSelect(null);
      }
      
      toast({
        title: "Account deleted",
        description: `API account "${accountToDelete.nickname}" has been deleted successfully`,
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting API account:', error);
      toast({
        title: "Failed to delete account",
        description: error.message || "Could not delete your API account",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleSelectAccount = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (account) {
      // Update active status for all accounts
      setAccounts(prev => 
        prev.map(acc => ({
          ...acc,
          isActive: acc.id === accountId
        }))
      );
      
      onAccountSelect(account);
    }
  };

  return {
    isSaving,
    handleCreateAccount,
    handleUpdateAccount,
    handleDeleteAccount,
    handleSelectAccount
  };
};
