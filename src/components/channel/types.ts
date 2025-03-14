
import { ApiAccount } from "@/types/channels";
import { Message } from "@/types/dashboard";
import { ConnectionResult } from "@/services/telegram/types";

export interface ConnectionButtonProps {
  selectedAccount: ApiAccount | null;
  isConnected: boolean;
  isConnecting: boolean;
  channelPairs: any[];
  isSaving: boolean;
  onConnected: (listener: any) => void;
  onDisconnected: () => void;
  onNewMessages: (messages: Message[]) => void;
}

export interface TempConnectionState {
  account: ApiAccount | null;
  connectionResult?: ConnectionResult;
}

export interface DiagnosticToolProps {
  isOpen?: boolean;
  onClose?: () => void;
}
