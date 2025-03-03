
import { useState, useEffect } from 'react';
import { ApiAccount } from '@/types/channels';
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
        setIsLoading(false);
        return;
      }
      
      const data = await fetchApiAccountsFromDb(userId);
      
      if (data && data.length > 0) {
        const formattedAccounts = data.map(account => 
          formatApiAccount(account, selectedAccountId)
        );
        
        setAccounts(formattedAccounts);
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

  // Fetch accounts on component mount or when userId/selectedAccountId changes
  useEffect(() => {
    if (userId) {
      fetchApiAccounts();
    }
  }, [userId, selectedAccountId]);
  
  return { accounts, setAccounts, isLoading, fetchApiAccounts };
};
