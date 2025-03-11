import { Message } from "@/types/dashboard";
import { ApiAccount, ChannelPair } from "@/types/channels";

export interface TelegramSession {
  accountId: string;
  sessionString: string;
  createdAt: Date;
}

export interface RealtimeListenerResult {
  stopListener: () => void;
}

export type MessageCallback = (messages: Message[]) => void;

export interface ConnectionResult {
  success: boolean;
  codeNeeded: boolean;
  phoneCodeHash?: string;
  error?: string;
  _testCode?: string;
}
