
import React from 'react';
import SettingsPanel from '../SettingsPanel';

interface DashboardSettingsProps {
  onSettingsChange: (settings: any) => void;
}

const DashboardSettings: React.FC<DashboardSettingsProps> = ({ onSettingsChange }) => {
  return <SettingsPanel onSettingsChange={onSettingsChange} />;
};

export default DashboardSettings;
