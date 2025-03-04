
import { useState, useEffect } from 'react';
import { ApiAccount } from '@/types/dashboard';
import { useAuth } from './useAuth';
import { fetchApiAccountsFromDb, formatApiAccount } from '@/utils/apiAccountUtils';
import { toast } from "@/components/ui/use-toast";

export const useApiAccountsList = (selectedAccountId: string | null) => {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { userId } = useAuth();
  
  const fetchApiAccounts = async () => {
    try {
      setIsLoading(true);
      
      if (!userId) {
        console.log('No userId available, skipping API accounts fetch');
        setIsLoading(false);
        return;
      }
      
      console.log('Fetching API accounts for user ID:', userId);
      const data = await fetchApiAccountsFromDb(userId);
      
      if (data && data.length > 0) {
        console.log(`Found ${data.length} API accounts`);
        const formattedAccounts = data.map(account => 
          formatApiAccount(account, selectedAccountId)
        );
        
        setAccounts(formattedAccounts);
        console.log('API accounts loaded:', formattedAccounts);
      } else {
        console.log('No API accounts found');
        setAccounts([]);
      }
    } catch (error) {
      console.error('Error in useApiAccountsList:', error);
      toast({
        title: "Failed to load accounts",
        description: error.message || "Could not load your API accounts",
        variant: "destructive",
      });
      setAccounts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch accounts on component mount or when userId/selectedAccountId changes
  useEffect(() => {
    console.log('useApiAccountsList useEffect triggered - userId:', userId, 'selectedAccountId:', selectedAccountId);
    if (userId) {
      fetchApiAccounts();
    } else {
      console.log('No userId available, waiting for authentication');
      setAccounts([]);
      setIsLoading(false);
    }
  }, [userId, selectedAccountId]);
  
  return { accounts, setAccounts, isLoading, fetchApiAccounts };
};
