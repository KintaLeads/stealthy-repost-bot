
import React, { useState, useEffect } from 'react';
import { toast } from "@/components/ui/use-toast";
import { processMessageText } from '../utils/messageUtils';
import { Message, ApiAccount, MetricsData } from '../types/dashboard';

// Import refactored components
import DashboardMetrics from './dashboard/DashboardMetrics';
import AccountManagement from './dashboard/AccountManagement';
import MessageManagement from './dashboard/MessageManagement';
import DashboardSettings from './dashboard/DashboardSettings';

interface DashboardProps {
  isConnected: boolean;
  onToggleConnection: () => void;
  onSettingsChange: (settings: any) => void;
  isLoading: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({
  isConnected,
  onToggleConnection,
  onSettingsChange,
  isLoading
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [metrics, setMetrics] = useState<MetricsData>({
    totalMessages: 0,
    processedMessages: 0,
    lastUpdate: '2m ago',
    uptime: '3d 8h'
  });
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<ApiAccount | null>(null);
  
  // Simulating data fetch with sample data
  useEffect(() => {
    if (!isLoading && selectedAccount) {
      // Sample competitor usernames that would typically come from the database
      const sampleCompetitors = ['competitor_telegram_username', 'other_competitor', 'third_competitor'];
      setCompetitors(sampleCompetitors);
      
      // Sample messages
      const sampleMessages = [
        {
          id: '1',
          text: 'Check out our latest product launch! Contact @competitor_telegram_username for more details.',
          time: '10:30 AM',
          username: 'channel_admin',
          processed: true
        },
        {
          id: '2',
          text: "We're running a special promotion this weekend. Don't miss out!",
          media: 'https://images.unsplash.com/photo-1586880244406-556ebe35f282?q=80&w=1074&auto=format&fit=crop',
          time: 'Yesterday',
          username: 'channel_admin',
          processed: true
        },
        {
          id: '3',
          text: 'Important announcement: Our team will be at the industry conference next week. Come visit our booth or message t.me/competitor_telegram_username!',
          time: '2 days ago',
          username: 'channel_admin',
          processed: false
        }
      ];
      
      // Process each message to detect competitor mentions and add CTA
      const targetUsername = 'your_username_provided'; // This would come from the selected channel pair
      
      const processedMessages = sampleMessages.map(message => {
        const processedText = processMessageText(message.text, sampleCompetitors, targetUsername);
          
        return {
          ...message,
          detectedCompetitors: processedText.detectedCompetitors,
          modifiedText: processedText.modifiedText,
          finalText: processedText.finalText
        };
      });
      
      setMessages(processedMessages);
      
      // Update metrics based on processed messages
      setMetrics({
        totalMessages: processedMessages.length,
        processedMessages: processedMessages.filter(m => m.processed).length,
        lastUpdate: '2m ago',
        uptime: '3d 8h'
      });
    }
  }, [isLoading, selectedAccount]);
  
  const handleAccountSelect = (account: ApiAccount) => {
    setSelectedAccount(account);
    console.log("Selected account:", account);
    
    // In a real implementation, you would load channel pairs for this account from the database
  };
  
  return (
    <div className="w-full max-w-7xl mx-auto px-8 pb-12">
      <div className="grid gap-8">
        <DashboardMetrics metrics={metrics} isLoading={isLoading} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AccountManagement 
            onAccountSelect={handleAccountSelect}
            selectedAccountId={selectedAccount?.id || null}
          />
          
          <MessageManagement 
            messages={messages}
            selectedAccount={selectedAccount}
            isConnected={isConnected}
            onToggleConnection={onToggleConnection}
            isLoading={isLoading}
          />
        </div>
        
        <DashboardSettings onSettingsChange={onSettingsChange} />
      </div>
    </div>
  );
};

export default Dashboard;
