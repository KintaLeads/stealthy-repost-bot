
import { ApiAccount, ChannelPair } from '@/types/channels';
import { supabase } from "@/integrations/supabase/client";
import { logError, logInfo } from "@/services/telegram/debugger";

export const useChannelPairsDatabase = (
  selectedAccount: ApiAccount | null,
  setChannelPairs: (pairs: ChannelPair[]) => void,
  setIsLoading: (loading: boolean) => void,
  setIsSaving: (saving: boolean) => void
) => {
  const fetchChannelPairs = async () => {
    if (!selectedAccount) {
      logInfo("ChannelPairs", "No account selected");
      return;
    }

    try {
      setIsLoading(true);
      const { data: storedPairs, error } = await supabase
        .from('channel_pairs')
        .select('*')
        .eq('account_id', selectedAccount.id);

      if (error) throw error;

      if (storedPairs && storedPairs.length > 0) {
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
      }
    } catch (error) {
      logError("ChannelPairs", "Fetch error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const savePairsToSupabase = async (pairs: ChannelPair[]) => {
    if (!selectedAccount) {
      logInfo("ChannelPairs", "No account selected");
      return;
    }

    try {
      setIsSaving(true);

      // Delete existing pairs
      const { error: deleteError } = await supabase
        .from('channel_pairs')
        .delete()
        .eq('account_id', selectedAccount.id);

      if (deleteError) throw deleteError;

      // Insert new pairs
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

      if (insertError) throw insertError;

      logInfo("ChannelPairs", "Save successful:", pairs);
    } catch (error) {
      logError("ChannelPairs", "Save error:", error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    fetchChannelPairs,
    savePairsToSupabase
  };
};
