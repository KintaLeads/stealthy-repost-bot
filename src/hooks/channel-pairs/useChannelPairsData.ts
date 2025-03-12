import { useState, useEffect } from 'react';
import { ChannelPair, ApiAccount } from '@/types/channels';
import { toast } from "@/components/ui/use-toast";
import { UseChannelPairsState, UseChannelPairsStateInternal } from './types';
import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/services/telegram/debugger";

export const useChannelPairsData = (selectedAccount: ApiAccount | null): UseChannelPairsStateInternal & { 
  fetchChannelPairs: () => Promise<void> 
} => {
  const [channelPairs, setChannelPairs] = useState<ChannelPair[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoRepost, setIsAutoRepost] = useState(true);
  
  const fetchChannelPairs = async () => {
    if (!selectedAccount) return;
    
    try {
      setIsLoading(true);
      
      const { data: storedPairs, error } = await supabase
        .from('channel_pairs')
        .select('*')
        .eq('account_id', selectedAccount.id);
      
      if (error) {
        const errorDetails = {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        };
        logError(
          "ChannelPairs",
          `Failed to fetch channel pairs for account ${selectedAccount.id}:`,
          errorDetails
        );
        throw error;
      }
      
      if (storedPairs && storedPairs.length > 0) {
        console.log(`Loaded ${storedPairs.length} channel pairs from Supabase for account: ${selectedAccount?.nickname}`);
        
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
      const errorMessage = error instanceof Error ? 
        error.message : 
        'An unexpected error occurred while fetching channel pairs';
      
      logError(
        "ChannelPairs",
        `Error fetching channel pairs for account ${selectedAccount?.nickname}:`,
        { error, account: selectedAccount.id }
      );
      
      toast({
        title: "Failed to load channels",
        description: errorMessage,
        variant: "destructive",
      });
      
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
  
  const savePairsToSupabase = async (pairs: ChannelPair[]) => {
    if (!selectedAccount) return;
    
    try {
      const { error: deleteError } = await supabase
        .from('channel_pairs')
        .delete()
        .eq('account_id', selectedAccount.id);
      
      if (deleteError) {
        const errorDetails = {
          code: deleteError.code,
          message: deleteError.message,
          details: deleteError.details,
          hint: deleteError.hint
        };
        logError(
          "ChannelPairs",
          `Failed to delete existing channel pairs for account ${selectedAccount.id}:`,
          errorDetails
        );
        throw deleteError;
      }
      
      const transformedPairs = pairs.map(pair => ({
        id: pair.id,
        created_at: pair.createdAt,
        source_channel: pair.sourceChannel,
        target_channel: pair.targetChannel,
        target_username: pair.targetUsername,
        account_id: pair.accountId,
        is_active: pair.isActive
      }));
      
      const { error: insertError } = await supabase
        .from('channel_pairs')
        .insert(transformedPairs);
      
      if (insertError) {
        const errorDetails = {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        };
        logError(
          "ChannelPairs",
          `Failed to insert new channel pairs for account ${selectedAccount.id}:`,
          errorDetails
        );
        throw insertError;
      }
      
      console.log(`Saved ${pairs.length} channel pairs to Supabase for account: ${selectedAccount?.nickname}`);
    } catch (error) {
      logError(
        "ChannelPairs",
        `Error saving channel pairs to Supabase for account ${selectedAccount?.nickname}:`,
        { error, pairsCount: pairs.length }
      );
      throw error;
    }
  };
  
  const setPairsWithDatabase = async (pairs: ChannelPair[]) => {
    setChannelPairs(pairs);
    try {
      await savePairsToSupabase(pairs);
    } catch (error) {
      console.error('Failed to save channel pairs to database:', error);
    }
  };
  
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
