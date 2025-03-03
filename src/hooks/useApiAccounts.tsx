
import { useState, useEffect } from 'react';
import { ApiAccount } from '@/types/channels';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export const useApiAccounts = (selectedAccountId: string | null, onAccountSelect: (account: ApiAccount) => void) => {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Fetch API accounts on component mount
  useEffect(() => {
    fetchApiAccounts();
  }, []);
  
  const fetchApiAccounts = async () => {
    try {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast({
          title: "Authentication required",
          description: "Please log in to manage API accounts",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('api_credentials')
        .select('*')
        .eq('api_name', 'myproto_telegram')
        .eq('user_id', session.user.id)
        .order('api_key', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        const formattedAccounts = data.map(account => ({
          id: account.id,
          nickname: account.api_name || 'Default Account',
          apiKey: account.api_key || '',
          apiHash: account.api_secret?.split('|')[0] || '',
          phoneNumber: account.api_secret?.split('|')[1] || '',
          isActive: selectedAccountId === account.id
        }));
        
        setAccounts(formattedAccounts);
        
        // If there's no selected account yet but we have accounts, select the first one
        if (!selectedAccountId && formattedAccounts.length > 0) {
          onAccountSelect(formattedAccounts[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching API accounts:', error);
      toast({
        title: "Failed to load accounts",
        description: error.message || "Could not load your API accounts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCreateAccount = async (newAccount: ApiAccount) => {
    try {
      if (!newAccount.nickname || !newAccount.apiKey || !newAccount.apiHash || !newAccount.phoneNumber) {
        toast({
          title: "Missing information",
          description: "Please fill all required fields",
          variant: "destructive",
        });
        return;
      }
      
      setIsSaving(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast({
          title: "Authentication required",
          description: "Please log in to create API accounts",
          variant: "destructive",
        });
        return;
      }
      
      // Prepare API secret (combines apiHash and phoneNumber)
      const apiSecret = `${newAccount.apiHash}|${newAccount.phoneNumber}`;
      
      const { data, error } = await supabase
        .from('api_credentials')
        .insert({
          user_id: session.user.id,
          api_name: newAccount.nickname, // Store nickname in api_name field
          api_key: newAccount.apiKey,
          api_secret: apiSecret
        })
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        const createdAccount = {
          id: data.id,
          nickname: data.api_name, // Use api_name as nickname
          apiKey: data.api_key,
          apiHash: newAccount.apiHash,
          phoneNumber: newAccount.phoneNumber,
          isActive: true
        };
        
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
      if (!account.nickname || !account.apiKey || !account.apiHash || !account.phoneNumber) {
        toast({
          title: "Missing information",
          description: "Please fill all required fields",
          variant: "destructive",
        });
        return false;
      }
      
      setIsSaving(true);
      
      // Prepare API secret (combines apiHash and phoneNumber)
      const apiSecret = `${account.apiHash}|${account.phoneNumber}`;
      
      const { error } = await supabase
        .from('api_credentials')
        .update({
          api_key: account.apiKey,
          api_secret: apiSecret,
          api_name: account.nickname, // Update api_name with nickname
          updated_at: new Date().toISOString()
        })
        .eq('id', account.id);
      
      if (error) throw error;
      
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
      
      setIsLoading(true);
      
      const { error } = await supabase
        .from('api_credentials')
        .delete()
        .eq('id', accountId);
      
      if (error) throw error;
      
      // Update local state
      const updatedAccounts = accounts.filter(acc => acc.id !== accountId);
      setAccounts(updatedAccounts);
      
      // If we deleted the selected account, select another one if available
      if (selectedAccountId === accountId && updatedAccounts.length > 0) {
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
      setIsLoading(false);
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
    accounts,
    isLoading,
    isSaving,
    handleCreateAccount,
    handleUpdateAccount,
    handleDeleteAccount,
    handleSelectAccount
  };
};
