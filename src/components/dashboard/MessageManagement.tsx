
import React, { useState } from 'react';
import MessagePreview from '../MessagePreview';
import ChannelPairManager from '../ChannelPairManager';
import { Message } from '@/types/dashboard';
import { ApiAccount } from '@/types/channels';
import { Badge } from "@/components/ui/badge";
import { WifiIcon, WifiOffIcon } from 'lucide-react';

interface MessageManagementProps {
  messages: Message[];
  selectedAccount: ApiAccount | null;
  isConnected: boolean;
  onToggleConnection: () => void;
  isLoading: boolean;
}

const MessageManagement: React.FC<MessageManagementProps> = ({
  messages,
  selectedAccount,
  isConnected,
  onToggleConnection,
  isLoading
}) => {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium">Message Monitoring</h3>
        {isConnected ? (
          <Badge variant="outline" className="flex items-center gap-1.5 text-xs font-normal text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 py-1 px-3 rounded-full">
            <WifiIcon size={14} />
            <span>Real-time listener active</span>
          </Badge>
        ) : (
          <Badge variant="outline" className="flex items-center gap-1.5 text-xs font-normal text-gray-600 bg-gray-50 dark:bg-gray-900/20 dark:text-gray-400 py-1 px-3 rounded-full">
            <WifiOffIcon size={14} />
            <span>Listener disconnected</span>
          </Badge>
        )}
      </div>
      
      <ChannelPairManager 
        selectedAccount={selectedAccount}
        isConnected={isConnected}
        onToggleConnection={onToggleConnection}
      />
      
      <MessagePreview 
        messages={messages}
        isLoading={isLoading}
      />
    </div>
  );
};

export default MessageManagement;
