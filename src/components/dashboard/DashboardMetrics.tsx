
import React from 'react';
import StatusMetrics from '../StatusMetrics';

interface MetricsData {
  totalMessages: number;
  processedMessages: number;
  lastUpdate: string;
  uptime: string;
}

interface DashboardMetricsProps {
  metrics: MetricsData;
  isLoading: boolean;
}

const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ 
  metrics, 
  isLoading 
}) => {
  return <StatusMetrics metrics={metrics} isLoading={isLoading} />;
};

export default DashboardMetrics;
