
import React, { useState, useEffect } from 'react';
import MessagePreview from '../MessagePreview';
import ChannelPairManager from '../ChannelPairManager';
import { Message } from '@/types/dashboard';
import { ApiAccount } from '@/types/channels';
import { Badge } from "@/components/ui/badge";
import { WifiIcon, WifiOffIcon } from 'lucide-react';
import { processMessageText } from '@/utils/messageUtils';

interface MessageManagementProps {
  messages: Message[];
  selectedAccount: ApiAccount | null;
  isConnected: boolean;
  onToggleConnection: () => void;
  isLoading: boolean;
}

const MessageManagement: React.FC<MessageManagementProps> = ({
  messages: initialMessages,
  selectedAccount,
  isConnected,
  onToggleConnection,
  isLoading
}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  
  // Update messages when props change
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);
  
  // Handle new messages from the realtime listener
  const handleNewMessages = (newMessages: Message[]) => {
    // Process messages to detect competitor mentions
    const competitors = ['competitor_telegram_username', 'other_competitor', 'third_competitor'];
    const targetUsername = 'your_username'; // This should come from the selected channel pair
    
    const processedMessages = newMessages.map(message => {
      const processedText = processMessageText(message.text, competitors, targetUsername);
      
      return {
        ...message,
        detectedCompetitors: processedText.detectedCompetitors,
        modifiedText: processedText.modifiedText,
        finalText: processedText.finalText,
        processed: true
      };
    });
    
    // Add new messages to the top of the list
    setMessages(prevMessages => {
      // Create a map of existing message IDs for quick lookup
      const existingIds = new Set(prevMessages.map(m => m.id));
      
      // Filter out messages that already exist
      const uniqueNewMessages = processedMessages.filter(m => !existingIds.has(m.id));
      
      // Return the combined messages, with new messages at the top
      return [...uniqueNewMessages, ...prevMessages].slice(0, 100); // Limit to 100 messages
    });
  };
  
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
        onNewMessages={handleNewMessages}
      />
      
      <MessagePreview 
        messages={messages}
        isLoading={isLoading}
      />
    </div>
  );
};

export default MessageManagement;
