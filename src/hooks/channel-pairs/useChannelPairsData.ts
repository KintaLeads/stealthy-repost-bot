
import { useState, useEffect } from 'react';
import { ChannelPair, ApiAccount } from '@/types/channels';
import { toast } from "@/components/ui/use-toast";
import { UseChannelPairsState } from './types';

export const useChannelPairsData = (selectedAccount: ApiAccount | null): UseChannelPairsState & { 
  fetchChannelPairs: () => Promise<void> 
} => {
  const [channelPairs, setChannelPairs] = useState<ChannelPair[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoRepost, setIsAutoRepost] = useState(true);
  
  // Load channel pairs when the selected account changes
  useEffect(() => {
    if (selectedAccount) {
      fetchChannelPairs();
    } else {
      setChannelPairs([]);
    }
  }, [selectedAccount]);
  
  const fetchChannelPairs = async () => {
    if (!selectedAccount) return;
    
    try {
      setIsLoading(true);
      
      // In a real implementation, this would fetch from the database
      // For this demo, we'll generate sample data
      const samplePairs = [
        {
          id: '1',
          sourceChannel: 'competitor_channel',
          targetChannel: 'my_channel',
          targetUsername: 'my_username',
          isActive: true
        }
      ];
      
      setChannelPairs(samplePairs);
    } catch (error) {
      console.error('Error fetching channel pairs:', error);
      toast({
        title: "Failed to load channels",
        description: "Could not load your channel configurations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    channelPairs,
    isLoading,
    isSaving,
    isAutoRepost,
    setIsAutoRepost,
    fetchChannelPairs,
    setChannelPairs,
    setIsSaving
  };
};
