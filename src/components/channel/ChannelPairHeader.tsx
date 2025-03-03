
import React from 'react';
import { CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { ApiAccount } from "@/types/channels";

interface ChannelPairHeaderProps {
  selectedAccount: ApiAccount;
  isConnected: boolean;
  channelPairsCount: number;
}

const ChannelPairHeader: React.FC<ChannelPairHeaderProps> = ({
  selectedAccount,
  isConnected,
  channelPairsCount
}) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <CardTitle className="text-xl flex items-center">
          <span>Channel Configuration</span>
          {isConnected && (
            <Badge className="ml-2 flex items-center gap-1.5 text-xs font-normal text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 py-0.5 px-2 rounded-full">
              <Check size={14} />
              <span>Connected</span>
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Configure channel pairs for <strong>{selectedAccount.nickname}</strong>
        </CardDescription>
      </div>
      <Badge variant="outline" className="px-2 py-1">
        {channelPairsCount} {channelPairsCount === 1 ? 'Pair' : 'Pairs'}
      </Badge>
    </div>
  );
};

export default ChannelPairHeader;
