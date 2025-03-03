
import React, { useEffect, useState } from "react";
import Dashboard from "../components/Dashboard";
import { useChannelConfig } from "../hooks/useChannelConfig";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import AuthForm from "@/components/AuthForm";
import PageLayout from "@/components/PageLayout";
import LoadingScreen from "@/components/LoadingScreen";

const Index = () => {
  const {
    isConnected,
    isLoading: configLoading,
    isDarkMode,
    toggleConnection,
    toggleDarkMode,
    updateSettings
  } = useChannelConfig();

  const [session, setSession] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsAuthLoading(false);
    });

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
  };

  if (isAuthLoading) {
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
