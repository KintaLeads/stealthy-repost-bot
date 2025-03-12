
import { useState, useEffect } from 'react';
import { ChannelPair, ApiAccount } from '@/types/channels';
import { toast } from "@/components/ui/use-toast";
import { UseChannelPairsState, UseChannelPairsStateInternal } from './types';
import { supabase } from "@/integrations/supabase/client";

export const useChannelPairsData = (selectedAccount: ApiAccount | null): UseChannelPairsStateInternal & { 
  fetchChannelPairs: () => Promise<void> 
} => {
  const [channelPairs, setChannelPairs] = useState<ChannelPair[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoRepost, setIsAutoRepost] = useState(true);
  
  // Fetch channel pairs from Supabase
  const fetchChannelPairs = async () => {
    if (!selectedAccount) return;
    
    try {
      setIsLoading(true);
      
      const { data: storedPairs, error } = await supabase
        .from('channel_pairs')
        .select('*')
        .eq('account_id', selectedAccount.id);
      
      if (error) {
        throw error;
      }
      
      if (storedPairs && storedPairs.length > 0) {
        console.log(`Loaded ${storedPairs.length} channel pairs from Supabase for account: ${selectedAccount?.nickname}`);
        
        // Transform from DB schema (snake_case) to application schema (camelCase)
        const transformedPairs: ChannelPair[] = storedPairs.map(pair => ({
          id: pair.id,
          createdAt: pair.created_at,
          sourceChannel: pair.source_channel,
          targetChannel: pair.target_channel,
          targetUsername: pair.target_username || '',
          accountId: pair.account_id,
          isActive: pair.is_active
        }));
        
        setChannelPairs(transformedPairs);
      } else {
        // If no stored pairs, create a default one
        const defaultPair: ChannelPair = {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          sourceChannel: '',
          targetChannel: '',
          targetUsername: '',
          accountId: selectedAccount.id,
          isActive: true
        };
        
        await savePairsToSupabase([defaultPair]);
        setChannelPairs([defaultPair]);
        console.log(`Created default channel pair for account: ${selectedAccount?.nickname}`);
      }
    } catch (error) {
      console.error('Error fetching channel pairs:', error);
      toast({
        title: "Failed to load channels",
        description: "Could not load your channel configurations from the database",
        variant: "destructive",
      });
      
      // Create a default pair if we can't load from Supabase
      const defaultPair: ChannelPair = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        sourceChannel: '',
        targetChannel: '',
        targetUsername: '',
        accountId: selectedAccount.id,
        isActive: true
      };
      setChannelPairs([defaultPair]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Save channel pairs to Supabase
  const savePairsToSupabase = async (pairs: ChannelPair[]) => {
    if (!selectedAccount) return;
    
    try {
      // First, delete existing pairs for this account
      const { error: deleteError } = await supabase
        .from('channel_pairs')
        .delete()
        .eq('account_id', selectedAccount.id);
      
      if (deleteError) {
        throw deleteError;
      }
      
      // Transform from application schema (camelCase) to DB schema (snake_case)
      const transformedPairs = pairs.map(pair => ({
        id: pair.id,
        created_at: pair.createdAt,
        source_channel: pair.sourceChannel,
        target_channel: pair.targetChannel,
        target_username: pair.targetUsername,
        account_id: pair.accountId,
        is_active: pair.isActive
      }));
      
      // Then insert the new pairs
      const { error: insertError } = await supabase
        .from('channel_pairs')
        .insert(transformedPairs);
      
      if (insertError) {
        throw insertError;
      }
      
      console.log(`Saved ${pairs.length} channel pairs to Supabase for account: ${selectedAccount?.nickname}`);
    } catch (error) {
      console.error('Error saving channel pairs to Supabase:', error);
      throw error;
    }
  };
  
  // Override setChannelPairs to also save to Supabase
  const setPairsWithDatabase = async (pairs: ChannelPair[]) => {
    setChannelPairs(pairs);
    try {
      await savePairsToSupabase(pairs);
    } catch (error) {
      console.error('Failed to save channel pairs to database:', error);
    }
  };
  
  // Load channel pairs when the selected account changes
  useEffect(() => {
    if (selectedAccount) {
      fetchChannelPairs();
    } else {
      setChannelPairs([]);
    }
  }, [selectedAccount]);

  return {
    channelPairs,
    isLoading,
    isSaving,
    isAutoRepost,
    setIsAutoRepost,
    fetchChannelPairs,
    setChannelPairs: setPairsWithDatabase,
    setIsSaving
  };
};
