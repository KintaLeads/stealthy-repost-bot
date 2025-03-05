
import React, { useState } from 'react';
import { toast } from "@/components/ui/use-toast";
import { ApiAccount, MetricsData } from '../types/dashboard';

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
  // Real-time metrics state
  const [metrics, setMetrics] = useState<MetricsData>({
    totalMessages: 0,
    processedMessages: 0,
    lastUpdate: 'Never',
    uptime: 'Just started'
  });
  const [selectedAccount, setSelectedAccount] = useState<ApiAccount | null>(null);
  
  const handleAccountSelect = (account: ApiAccount) => {
    setSelectedAccount(account);
    console.log("Selected account:", account);
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
            messages={[]} // Pass empty array instead of mock data
            selectedAccount={selectedAccount}
            isConnected={isConnected}
            onToggleConnection={onToggleConnection}
            isLoading={isLoading}
            onMetricsUpdate={setMetrics} // Add this to update metrics from real messages
          />
        </div>
        
        <DashboardSettings onSettingsChange={onSettingsChange} />
      </div>
    </div>
  );
};

export default Dashboard;
