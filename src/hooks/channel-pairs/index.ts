
import { UseChannelPairsReturn } from './types';
import { useChannelPairsData } from './useChannelPairsData';
import { useChannelPairsActions } from './useChannelPairsActions';
import { ApiAccount } from '@/types/channels';

export const useChannelPairs = (selectedAccount: ApiAccount | null): UseChannelPairsReturn => {
  const { 
    channelPairs, 
    isLoading, 
    isSaving, 
    isAutoRepost, 
    setIsAutoRepost, 
    fetchChannelPairs,
    setChannelPairs,
    setIsSaving
  } = useChannelPairsData(selectedAccount);
  
  const actions = useChannelPairsActions(
    selectedAccount,
    channelPairs,
    setChannelPairs,
    setIsSaving
  );

  return {
    // State
    channelPairs,
    isLoading,
    isSaving,
    isAutoRepost,
    
    // Actions
    handleChannelPairChange: actions.handleChannelPairChange,
    addChannelPair: actions.addChannelPair,
    removeChannelPair: actions.removeChannelPair,
    saveChannelPairs: actions.saveChannelPairs,
    setIsAutoRepost,
    fetchChannelPairs
  };
};

export * from './types';
