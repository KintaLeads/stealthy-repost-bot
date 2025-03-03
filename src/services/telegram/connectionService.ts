
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { ApiAccount } from "@/types/channels";
import { storeSession } from "./sessionManager";

/**
 * Connect to Telegram API
 */
export const connectToTelegram = async (account: ApiAccount): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('telegram-connector', {
      body: {
        operation: 'connect',
        apiId: account.apiKey,
        apiHash: account.apiHash,
        phoneNumber: account.phoneNumber
      }
    });
    
    if (error) {
      toast({
        title: "Connection Failed",
        description: `Could not connect to Telegram: ${error.message}`,
        variant: "destructive",
      });
      return false;
    }
    
    if (data.sessionString) {
      storeSession(data.sessionString);
    }
    
    toast({
      title: "Connected to Telegram",
      description: "Successfully connected to Telegram API"
    });
    
    return true;
  } catch (error) {
    console.error('Error connecting to Telegram:', error);
    toast({
      title: "Connection Error",
      description: `Failed to connect to Telegram API: ${error.message}`,
      variant: "destructive",
    });
    return false;
  }
};
