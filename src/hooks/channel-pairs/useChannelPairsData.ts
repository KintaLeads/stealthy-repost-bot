
import { useState, useEffect } from 'react';
import { ChannelPair, ApiAccount } from '@/types/channels';
import { toast } from "@/components/ui/use-toast";
import { UseChannelPairsState, UseChannelPairsStateInternal } from './types';
import { supabase } from "@/integrations/supabase/client";
import { logError, logInfo } from "@/services/telegram/debugger";

export const useChannelPairsData = (selectedAccount: ApiAccount | null): UseChannelPairsStateInternal & { 
  fetchChannelPairs: () => Promise<void> 
} => {
  const [channelPairs, setChannelPairs] = useState<ChannelPair[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoRepost, setIsAutoRepost] = useState(true);
  
  const fetchChannelPairs = async () => {
    if (!selectedAccount) {
      logInfo("ChannelPairs", "No account selected, skipping fetch");
      return;
    }
    
    try {
      setIsLoading(true);
      logInfo("ChannelPairs", `Fetching channel pairs for account: ${selectedAccount.nickname}`);
      
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
        logInfo("ChannelPairs", `Found ${storedPairs.length} existing pairs for account: ${selectedAccount.nickname}`);
        
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
        logInfo("ChannelPairs", `No existing pairs found for account: ${selectedAccount.nickname}, creating default`);
        
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
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      logError(
        "ChannelPairs",
        `Error fetching channel pairs for account ${selectedAccount.nickname}:`,
        { error, accountId: selectedAccount.id }
      );
      
      toast({
        title: "Failed to load channels",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Create a default pair even on error to allow the user to continue
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
    if (!selectedAccount) {
      logInfo("ChannelPairs", "No account selected, skipping save");
      return;
    }
    
    try {
      setIsSaving(true);
      logInfo("ChannelPairs", `Saving ${pairs.length} pairs for account: ${selectedAccount.nickname}`);
      
      // Delete existing pairs
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
      
      // Transform pairs to match database schema
      const transformedPairs = pairs.map(pair => ({
        id: pair.id,
        created_at: pair.createdAt,
        source_channel: pair.sourceChannel,
        target_channel: pair.targetChannel,
        target_username: pair.targetUsername,
        account_id: pair.accountId,
        is_active: pair.isActive
      }));
      
      // Insert new pairs
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
      
      logInfo("ChannelPairs", `Successfully saved ${pairs.length} pairs for account: ${selectedAccount.nickname}`);
    } catch (error) {
      logError(
        "ChannelPairs",
        `Error saving channel pairs to Supabase for account ${selectedAccount.nickname}:`,
        { error, pairsCount: pairs.length }
      );
      throw error;
    } finally {
      setIsSaving(false);
    }
  };
  
  const setPairsWithDatabase = async (pairs: ChannelPair[]) => {
    setChannelPairs(pairs);
    try {
      await savePairsToSupabase(pairs);
      logInfo("ChannelPairs", "Channel pairs saved successfully:", pairs);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      
      logError(
        "ChannelPairs",
        "Failed to save channel pairs to database:",
        { error, pairs }
      );
      
      toast({
        title: "Failed to save channel pairs",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };
  
  useEffect(() => {
    if (selectedAccount) {
      logInfo("ChannelPairs", `Selected account changed to: ${selectedAccount.nickname}`);
      fetchChannelPairs();
    } else {
      logInfo("ChannelPairs", "No account selected, clearing pairs");
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
