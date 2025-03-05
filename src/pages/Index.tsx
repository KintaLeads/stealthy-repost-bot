
import React, { useEffect, useState } from "react";
import Dashboard from "../components/Dashboard";
import { useChannelConfig } from "../hooks/useChannelConfig";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import AuthForm from "@/components/AuthForm";
import PageLayout from "@/components/PageLayout";
import LoadingScreen from "@/components/LoadingScreen";
import { useAuth } from "@/hooks/useAuth"; 

const Index = () => {
  const {
    isConnected,
    isLoading: configLoading,
    isDarkMode,
    toggleConnection,
    toggleDarkMode,
    updateSettings
  } = useChannelConfig();

  const { session, isLoading: authLoading } = useAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
  };

  if (authLoading) {
    return <LoadingScreen />;
  }

  return (
    <PageLayout
      isDarkMode={isDarkMode}
      toggleDarkMode={toggleDarkMode}
      userEmail={session?.user?.email}
      onSignOut={handleSignOut}
    >
      {session ? (
        <Dashboard 
          isConnected={isConnected}
          onToggleConnection={toggleConnection}
          onSettingsChange={updateSettings}
          isLoading={configLoading}
        />
      ) : (
        <AuthForm onAuthSuccess={() => {}} />
      )}
    </PageLayout>
  );
};

export default Index;
