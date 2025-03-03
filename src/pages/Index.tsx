
import React from "react";
import Header from "../components/Header";
import Dashboard from "../components/Dashboard";
import { useChannelConfig } from "../hooks/useChannelConfig";

const Index = () => {
  const {
    isConnected,
    isLoading,
    isDarkMode,
    toggleConnection,
    toggleDarkMode,
    updateSettings
  } = useChannelConfig();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header 
        isDarkMode={isDarkMode} 
        toggleDarkMode={toggleDarkMode} 
      />
      
      <main className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-8">
          <div className="mb-8 text-center animate-fade-in">
            <h1 className="text-4xl font-medium tracking-tight mb-3">
              Telegram Channel Manager
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Streamline your channel content with our elegant, intuitive management solution
            </p>
          </div>
          
          <Dashboard 
            isConnected={isConnected}
            onToggleConnection={toggleConnection}
            onSettingsChange={updateSettings}
            isLoading={isLoading}
          />
        </div>
      </main>
      
      <footer className="py-6 border-t border-border/40">
        <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Telegram Content Manager
          </p>
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} All rights reserved
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
