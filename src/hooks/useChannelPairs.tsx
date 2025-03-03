
import { useState, useEffect } from 'react';
import { ChannelPair, ApiAccount } from '@/types/channels';
import { toast } from "@/components/ui/use-toast";

export const useChannelPairs = (selectedAccount: ApiAccount | null) => {
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
  
  const handleChannelPairChange = (index: number, field: keyof ChannelPair, value: string | boolean) => {
    const updatedPairs = [...channelPairs];
    updatedPairs[index] = {
      ...updatedPairs[index],
      [field]: value
    };
    setChannelPairs(updatedPairs);
  };
  
  const addChannelPair = () => {
    setChannelPairs([
      ...channelPairs,
      {
        id: Date.now().toString(),
        sourceChannel: '',
        targetChannel: '',
        targetUsername: '',
        isActive: true
      }
    ]);
  };
  
  const removeChannelPair = (index: number) => {
    if (channelPairs.length === 1) {
      toast({
        title: "Cannot remove",
        description: "You must have at least one channel pair",
        variant: "destructive",
      });
      return;
    }
    
    const updatedPairs = channelPairs.filter((_, i) => i !== index);
    setChannelPairs(updatedPairs);
  };
  
  const saveChannelPairs = () => {
    if (!selectedAccount) {
      toast({
        title: "No account selected",
        description: "Please select or create an API account first",
        variant: "destructive",
      });
      return;
    }
    
    // Validate channel configurations
    const emptyFields = channelPairs.some(pair => 
      !pair.sourceChannel || !pair.targetChannel || !pair.targetUsername
    );
    
    if (emptyFields) {
      toast({
        title: "Missing information",
        description: "Please fill all required fields in all channel configurations",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Configuration saved",
        description: `${channelPairs.length} channel${channelPairs.length > 1 ? 's' : ''} configured successfully`,
      });
      setIsSaving(false);
    }, 1500);
  };
  
  return {
    channelPairs,
    isLoading,
    isSaving,
    isAutoRepost,
    setIsAutoRepost,
    handleChannelPairChange,
    addChannelPair,
    removeChannelPair,
    saveChannelPairs
  };
};
