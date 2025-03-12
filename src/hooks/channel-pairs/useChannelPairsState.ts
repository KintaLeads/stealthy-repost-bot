
import { useState } from 'react';
import { ChannelPair } from '@/types/channels';

export const useChannelPairsState = () => {
  const [channelPairs, setChannelPairs] = useState<ChannelPair[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoRepost, setIsAutoRepost] = useState(true);

  return {
    channelPairs,
    setChannelPairs,
    isLoading,
    setIsLoading,
    isSaving,
    setIsSaving,
    isAutoRepost,
    setIsAutoRepost
  };
};
