
import React, { useState, useEffect } from 'react';
import ChannelConfig from './ChannelConfig';
import MessagePreview from './MessagePreview';
import StatusMetrics from './StatusMetrics';
import SettingsPanel from './SettingsPanel';
import { supabase } from "@/integrations/supabase/client";
import { detectCompetitorMentions, replaceCompetitorMentions } from '../utils/messageUtils';

interface DashboardProps {
  isConnected: boolean;
  onToggleConnection: () => void;
  onSettingsChange: (settings: any) => void;
  isLoading: boolean;
}

// Define a message interface consistent with our database
interface Message {
  id: string;
  text: string;
  media?: string;
  time: string;
  username: string;
  processed: boolean;
  detectedCompetitors?: string[];
  modifiedText?: string;
}

const Dashboard: React.FC<DashboardProps> = ({
  isConnected,
  onToggleConnection,
  onSettingsChange,
  isLoading
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [metrics, setMetrics] = useState({
    totalMessages: 0,
    processedMessages: 0,
    lastUpdate: '2m ago',
    uptime: '3d 8h'
  });
  const [competitors, setCompetitors] = useState<string[]>([]);
  
  // Simulating data fetch with sample data
  useEffect(() => {
    if (!isLoading) {
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
      
      // Process each message to detect competitor mentions
      const processedMessages = sampleMessages.map(message => {
        const detectedCompetitors = detectCompetitorMentions(message.text, sampleCompetitors);
        const modifiedText = detectedCompetitors.length > 0 
          ? replaceCompetitorMentions(message.text, detectedCompetitors, 'your_username') 
          : undefined;
          
        return {
          ...message,
          detectedCompetitors,
          modifiedText
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
  }, [isLoading]);
  
  return (
    <div className="w-full max-w-7xl mx-auto px-8 pb-12">
      <div className="grid gap-8">
        <StatusMetrics metrics={metrics} isLoading={isLoading} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ChannelConfig 
            isConnected={isConnected}
            onToggleConnection={onToggleConnection}
          />
          
          <MessagePreview 
            messages={messages}
            isLoading={isLoading}
          />
        </div>
        
        <SettingsPanel onSettingsChange={onSettingsChange} />
      </div>
    </div>
  );
};

export default Dashboard;
