
import { useState, useEffect } from 'react';
import { ChannelPair, ApiAccount } from '@/types/channels';
import { toast } from "@/components/ui/use-toast";
import { UseChannelPairsState, UseChannelPairsStateInternal } from './types';

// Local storage key for channel pairs
const STORAGE_KEY_PREFIX = 'telegram_channel_pairs_';

export const useChannelPairsData = (selectedAccount: ApiAccount | null): UseChannelPairsStateInternal & { 
  fetchChannelPairs: () => Promise<void> 
} => {
  const [channelPairs, setChannelPairs] = useState<ChannelPair[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoRepost, setIsAutoRepost] = useState(true);
  
  // Get storage key for the current account
  const getStorageKey = () => {
    if (!selectedAccount) return null;
    return `${STORAGE_KEY_PREFIX}${selectedAccount.id}`;
  };
  
  // Save channel pairs to local storage
  const saveToLocalStorage = (pairs: ChannelPair[]) => {
    const storageKey = getStorageKey();
    if (!storageKey) return;
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(pairs));
      console.log(`Saved ${pairs.length} channel pairs to local storage for account: ${selectedAccount?.nickname}`);
    } catch (error) {
      console.error('Error saving channel pairs to local storage:', error);
    }
  };
  
  // Load channel pairs from local storage
  const loadFromLocalStorage = (): ChannelPair[] => {
    const storageKey = getStorageKey();
    if (!storageKey) return [];
    
    try {
      const storedPairs = localStorage.getItem(storageKey);
      if (!storedPairs) return [];
      
      const pairs = JSON.parse(storedPairs) as ChannelPair[];
      console.log(`Loaded ${pairs.length} channel pairs from local storage for account: ${selectedAccount?.nickname}`);
      return pairs;
    } catch (error) {
      console.error('Error loading channel pairs from local storage:', error);
      return [];
    }
  };
  
  // Override setChannelPairs to also save to local storage
  const setPairsWithStorage = (pairs: ChannelPair[]) => {
    setChannelPairs(pairs);
    saveToLocalStorage(pairs);
  };
  
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
      
      // Try to load from local storage first
      const storedPairs = loadFromLocalStorage();
      
      if (storedPairs.length > 0) {
        setChannelPairs(storedPairs);
      } else {
        // If no stored pairs, create a default one
        const defaultPair: ChannelPair = {
          id: '1',
          createdAt: new Date().toISOString(),
          sourceChannel: '',
          targetChannel: '',
          targetUsername: '',
          accountId: selectedAccount.id,
          isActive: true
        };
        
        setChannelPairs([defaultPair]);
        saveToLocalStorage([defaultPair]);
      }
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
    setChannelPairs: setPairsWithStorage,
    setIsSaving
  };
};
