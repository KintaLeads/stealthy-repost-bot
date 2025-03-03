
import React from 'react';
import MessagePreview from '../MessagePreview';
import ChannelPairManager from '../ChannelPairManager';

interface Message {
  id: string;
  text: string;
  media?: string;
  time: string;
  username: string;
  processed: boolean;
  detectedCompetitors?: string[];
  modifiedText?: string;
  finalText?: string;
}

interface ApiAccount {
  id: string;
  nickname: string;
  apiKey: string;
  apiHash: string;
  phoneNumber: string;
}

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
