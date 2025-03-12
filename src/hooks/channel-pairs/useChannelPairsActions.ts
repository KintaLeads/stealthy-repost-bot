
import { ChannelPair, ApiAccount } from '@/types/channels';
import { toast } from "@/components/ui/use-toast";
import { UseChannelPairsActions } from './types';

export const useChannelPairsActions = (
  selectedAccount: ApiAccount | null,
  channelPairs: ChannelPair[],
  setChannelPairs: (pairs: ChannelPair[]) => void,
  setIsSaving: (value: boolean) => void
): Omit<UseChannelPairsActions, 'setIsAutoRepost' | 'fetchChannelPairs'> => {
  
  const handleChannelPairChange = (index: number, field: keyof ChannelPair | 'targetUsername', value: string | boolean) => {
    const updatedPairs = [...channelPairs];
    updatedPairs[index] = {
      ...updatedPairs[index],
      [field]: value
    };
    setChannelPairs(updatedPairs);
  };
  
  const addChannelPair = () => {
    const newPair: ChannelPair = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      sourceChannel: '',
      targetChannel: '',
      targetUsername: '',
      accountId: selectedAccount?.id || '',
      isActive: true
    };
    
    setChannelPairs([...channelPairs, newPair]);
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
  
  const saveChannelPairs = async (): Promise<boolean> => {
    if (!selectedAccount) {
      toast({
        title: "No account selected",
        description: "Please select or create an API account first",
        variant: "destructive",
      });
      return false;
    }
    
    // Validate channel configurations
    const emptyFields = channelPairs.some(pair => 
      !pair.sourceChannel || !pair.targetChannel
    );
    
    if (emptyFields) {
      toast({
        title: "Missing information",
        description: "Please fill all required fields in all channel configurations",
        variant: "destructive",
      });
      return false;
    }

    setIsSaving(true);
    
    try {
      // Save channel pairs (already saved in state and localStorage via the setChannelPairs function)
      
      // Add a small delay to show saving indicator
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast({
        title: "Configuration saved",
        description: `${channelPairs.length} channel${channelPairs.length > 1 ? 's' : ''} configured successfully`,
      });
      
      // Additional logging to help with debugging
      console.log('Channel pairs saved successfully:', channelPairs);
      
      setIsSaving(false);
      return true;
    } catch (error) {
      console.error('Error saving channel pairs:', error);
      toast({
        title: "Save failed",
        description: "Could not save channel configurations",
        variant: "destructive",
      });
      setIsSaving(false);
      return false;
    }
  };

  return {
    handleChannelPairChange,
    addChannelPair,
    removeChannelPair,
    saveChannelPairs
  };
};
