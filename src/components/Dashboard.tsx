
import React from 'react';
import ChannelConfig from './ChannelConfig';
import MessagePreview from './MessagePreview';
import StatusMetrics from './StatusMetrics';
import SettingsPanel from './SettingsPanel';

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
  // Sample data for the message preview component
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
      text: 'We're running a special promotion this weekend. Don't miss out!',
      media: 'https://images.unsplash.com/photo-1586880244406-556ebe35f282?q=80&w=1074&auto=format&fit=crop',
      time: 'Yesterday',
      username: 'channel_admin',
      processed: true
    },
    {
      id: '3',
      text: 'Important announcement: Our team will be at the industry conference next week. Come visit our booth!',
      time: '2 days ago',
      username: 'channel_admin',
      processed: false
    }
  ];

  // Sample metrics data
  const metricsData = {
    totalMessages: 142,
    processedMessages: 138,
    lastUpdate: '2m ago',
    uptime: '3d 8h'
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-8 pb-12">
      <div className="grid gap-8">
        <StatusMetrics metrics={metricsData} isLoading={isLoading} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ChannelConfig 
            isConnected={isConnected}
            onToggleConnection={onToggleConnection}
          />
          
          <MessagePreview 
            messages={sampleMessages}
            isLoading={isLoading}
          />
        </div>
        
        <SettingsPanel onSettingsChange={onSettingsChange} />
      </div>
    </div>
  );
};

export default Dashboard;
