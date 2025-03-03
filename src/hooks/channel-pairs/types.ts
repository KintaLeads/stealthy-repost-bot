
import { ChannelPair, ApiAccount } from '@/types/channels';

export interface UseChannelPairsState {
  channelPairs: ChannelPair[];
  isLoading: boolean;
  isSaving: boolean;
  isAutoRepost: boolean;
}

export interface UseChannelPairsStateInternal extends UseChannelPairsState {
  setChannelPairs: (pairs: ChannelPair[]) => void;
  setIsSaving: (value: boolean) => void;
  setIsAutoRepost: (value: boolean) => void;
}

export interface UseChannelPairsActions {
  handleChannelPairChange: (index: number, field: keyof ChannelPair, value: string | boolean) => void;
  addChannelPair: () => void;
  removeChannelPair: (index: number) => void;
  saveChannelPairs: () => Promise<boolean>;
  setIsAutoRepost: (value: boolean) => void;
  fetchChannelPairs: () => Promise<void>;
}

export interface UseChannelPairsReturn extends UseChannelPairsState, UseChannelPairsActions {}
