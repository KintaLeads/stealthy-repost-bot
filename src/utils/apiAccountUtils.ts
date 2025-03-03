
import { supabase } from "@/integrations/supabase/client";
import { ApiAccount } from "@/types/channels";
import { toast } from "@/components/ui/use-toast";

// Format API accounts from database response
export const formatApiAccount = (account: any, selectedId?: string): ApiAccount => ({
  id: account.id,
  nickname: account.api_name || 'Default Account',
  apiKey: account.api_key || '',
  apiHash: account.api_secret?.split('|')[0] || '',
  phoneNumber: account.api_secret?.split('|')[1] || '',
  isActive: selectedId === account.id
});

// Fetch API accounts from database
export const fetchApiAccountsFromDb = async (userId: string) => {
  const { data, error } = await supabase
    .from('api_credentials')
    .select('*')
    .eq('api_name', 'myproto_telegram')
    .eq('user_id', userId)
    .order('api_key', { ascending: true });
    
  if (error) throw error;
  
  return data || [];
};

// Create a new API account in the database
export const createApiAccountInDb = async (userId: string, account: ApiAccount) => {
  // Prepare API secret (combines apiHash and phoneNumber)
  const apiSecret = `${account.apiHash}|${account.phoneNumber}`;
  
  const { data, error } = await supabase
    .from('api_credentials')
    .insert({
      user_id: userId,
      api_name: account.nickname,
      api_key: account.apiKey,
      api_secret: apiSecret
    })
    .select()
    .single();
    
  if (error) throw error;
  
  return data;
};

// Update an existing API account in the database
export const updateApiAccountInDb = async (accountId: string, account: ApiAccount) => {
  // Prepare API secret (combines apiHash and phoneNumber)
  const apiSecret = `${account.apiHash}|${account.phoneNumber}`;
  
  const { error } = await supabase
    .from('api_credentials')
    .update({
      api_key: account.apiKey,
      api_secret: apiSecret,
      api_name: account.nickname,
      updated_at: new Date().toISOString()
    })
    .eq('id', accountId);
    
  if (error) throw error;
  
  return true;
};

// Delete an API account from the database
export const deleteApiAccountFromDb = async (accountId: string) => {
  const { error } = await supabase
    .from('api_credentials')
    .delete()
    .eq('id', accountId);
    
  if (error) throw error;
  
  return true;
};

// Validate account data
export const validateAccount = (account: ApiAccount): boolean => {
  if (!account.nickname || !account.apiKey || !account.apiHash || !account.phoneNumber) {
    toast({
      title: "Missing information",
      description: "Please fill all required fields",
      variant: "destructive",
    });
    return false;
  }
  return true;
};
