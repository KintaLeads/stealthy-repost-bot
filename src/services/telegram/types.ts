
import { Message } from "@/types/dashboard";
import { ApiAccount, ChannelPair } from "@/types/channels";

export interface TelegramSession {
  sessionString: string;
  createdAt: Date;
}

export interface RealtimeListenerResult {
  stopListener: () => void;
}

export type MessageCallback = (messages: Message[]) => void;
