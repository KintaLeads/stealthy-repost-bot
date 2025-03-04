
import { supabase } from "@/integrations/supabase/client";
import { ApiAccount } from "@/types/dashboard";
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
  if (!userId) {
    console.error('Cannot fetch API accounts: No user ID provided');
    return [];
  }

  try {
    console.log('Fetching API accounts for user:', userId);
    
    const { data, error } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('api_name', 'myproto_telegram')
      .eq('user_id', userId)
      .order('api_key', { ascending: true });
      
    if (error) {
      console.error('Error fetching API accounts:', error);
      throw error;
    }
    
    console.log('Fetched API accounts:', data);
    return data || [];
  } catch (error) {
    console.error('Exception when fetching API accounts:', error);
    throw error;
  }
};

// Create a new API account in the database
export const createApiAccountInDb = async (userId: string, account: ApiAccount) => {
  // Prepare API secret (combines apiHash and phoneNumber)
  const apiSecret = `${account.apiHash}|${account.phoneNumber}`;
  
  console.log('Creating API account for user:', userId);
  
  const { data, error } = await supabase
    .from('api_credentials')
    .insert({
      user_id: userId,
      api_name: 'myproto_telegram', // Use a consistent value
      api_key: account.apiKey,
      api_secret: apiSecret
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error creating API account:', error);
    throw error;
  }
  
  console.log('Created API account:', data);
  return data;
};

// Update an existing API account in the database
export const updateApiAccountInDb = async (accountId: string, account: ApiAccount) => {
  // Prepare API secret (combines apiHash and phoneNumber)
  const apiSecret = `${account.apiHash}|${account.phoneNumber}`;
  
  console.log('Updating API account:', accountId);
  
  const { error } = await supabase
    .from('api_credentials')
    .update({
      api_key: account.apiKey,
      api_secret: apiSecret,
      api_name: 'myproto_telegram', // Use a consistent value
      updated_at: new Date().toISOString()
    })
    .eq('id', accountId);
    
  if (error) {
    console.error('Error updating API account:', error);
    throw error;
  }
  
  console.log('API account updated successfully');
  return true;
};

// Delete an API account from the database
export const deleteApiAccountFromDb = async (accountId: string) => {
  console.log('Deleting API account:', accountId);
  
  const { error } = await supabase
    .from('api_credentials')
    .delete()
    .eq('id', accountId);
    
  if (error) {
    console.error('Error deleting API account:', error);
    throw error;
  }
  
  console.log('API account deleted successfully');
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
