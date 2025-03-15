
import { supabase } from "@/integrations/supabase/client";
import { ApiAccount } from "@/types/channels";
import { toast } from "@/components/ui/use-toast";
import { logInfo, logError } from '../debugger';
import { clearSession } from '../session/sessionManager';

export interface ConnectionResult {
  success: boolean;
  error?: string;
}

export const connectToTelegram = async (account: ApiAccount): Promise<ConnectionResult> => {
  try {
    logInfo("ConnectionManager", "Connecting to Telegram", account.nickname);

    const { data, error } = await supabase.functions.invoke('telegram-connector', {
      body: {
        operation: 'connect',
        apiId: account.apiKey,
        apiHash: account.apiHash,
        phoneNumber: account.phoneNumber,
        accountId: account.id
      }
    });

    if (error) {
      logError("ConnectionManager", "Connection error:", error);
      throw error;
    }

    return {
      success: true
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError("ConnectionManager", "Failed to connect:", error);
    
    toast({
      title: "Connection Failed",
      description: errorMessage,
      variant: "destructive",
    });

    return {
      success: false,
      error: errorMessage
    };
  }
};

export const disconnectFromTelegram = async (account: ApiAccount): Promise<void> => {
  try {
    logInfo("ConnectionManager", "Disconnecting from Telegram", account.nickname);
    
    const { error } = await supabase.functions.invoke('telegram-connector', {
      body: {
        operation: 'disconnect',
        accountId: account.id
      }
    });

    if (error) {
      throw error;
    }

    clearSession(account.id);
    logInfo("ConnectionManager", "Disconnected successfully");
  } catch (error) {
    logError("ConnectionManager", "Disconnect error:", error);
    throw error;
  }
};
