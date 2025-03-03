
import { useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";

interface ChannelSettings {
  interval: number;
  isMediaEnabled: boolean;
  maxRetries: number;
  notificationType: string;
}

export const useChannelConfig = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [settings, setSettings] = useState<ChannelSettings>({
    interval: 5,
    isMediaEnabled: true,
    maxRetries: 3,
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
    setIsConnected(prev => !prev);
    
    toast({
      title: isConnected ? "Disconnected" : "Connected",
      description: isConnected 
        ? "Channel monitoring has been paused" 
        : "Now monitoring channel for new messages",
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
