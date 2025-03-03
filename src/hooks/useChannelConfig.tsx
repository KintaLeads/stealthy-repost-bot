
import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

interface ChannelSettings {
  isRealTimeMode: boolean;
  backupInterval: number;
  isMediaEnabled: boolean;
  notificationType: string;
}

export const useChannelConfig = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [settings, setSettings] = useState<ChannelSettings>({
    isRealTimeMode: true,
    backupInterval: 30,
    isMediaEnabled: true,
    notificationType: 'important'
  });
  
  const { toast } = useToast();

  useEffect(() => {
    // Check for system dark mode preference
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDarkMode);
    
    // Apply dark mode to document if needed
    if (prefersDarkMode) {
      document.documentElement.classList.add('dark');
    }
    
    // Simulate loading delay for initial data fetch
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  const toggleConnection = () => {
    const newConnectionState = !isConnected;
    setIsConnected(newConnectionState);
    
    toast({
      title: newConnectionState ? "Listener Active" : "Listener Stopped",
      description: newConnectionState 
        ? "Real-time monitoring has been activated" 
        : "Channel monitoring has been paused",
    });
  };
  
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
    
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };
  
  const updateSettings = (newSettings: Partial<ChannelSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    
    // If real-time mode was just enabled, show a helpful toast
    if (newSettings.isRealTimeMode && !settings.isRealTimeMode) {
      toast({
        title: "Real-time monitoring enabled",
        description: "Messages will be detected and processed instantly",
      });
    }
  };

  return {
    isConnected,
    isLoading,
    isDarkMode,
    settings,
    toggleConnection,
    toggleDarkMode,
    updateSettings
  };
};
