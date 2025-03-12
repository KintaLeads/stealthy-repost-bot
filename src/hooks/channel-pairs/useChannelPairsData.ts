
import { useState, useEffect } from 'react';
import { ChannelPair, ApiAccount } from '@/types/channels';
import { toast } from "@/components/ui/use-toast";
import { UseChannelPairsState } from './types';
import { supabase } from "@/integrations/supabase/client";
import { logError, logInfo } from "@/services/telegram/debugger";
import { useChannelPairsState } from './useChannelPairsState';
import { useChannelPairsDatabase } from './useChannelPairsDatabase';

export const useChannelPairsData = (selectedAccount: ApiAccount | null) => {
  const {
    channelPairs,
    setChannelPairs,
    isLoading,
    setIsLoading,
    isSaving,
    setIsSaving,
    isAutoRepost,
    setIsAutoRepost
  } = useChannelPairsState();

  const { savePairsToSupabase, fetchChannelPairs: fetchPairs } = useChannelPairsDatabase(
    selectedAccount,
    setChannelPairs,
    setIsLoading,
    setIsSaving
  );

  const setPairsWithDatabase = async (pairs: ChannelPair[]) => {
    setChannelPairs(pairs);
    try {
      await savePairsToSupabase(pairs);
      logInfo("ChannelPairs", "Pairs saved successfully:", pairs);
    } catch (error) {
      logError("ChannelPairs", "Failed to save pairs:", error);
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save channel pairs",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (selectedAccount) {
      fetchPairs();
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
    fetchChannelPairs: fetchPairs,
    setChannelPairs: setPairsWithDatabase,
    setIsSaving
  };
};
