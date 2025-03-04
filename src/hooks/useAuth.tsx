
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

export const useAuth = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('Checking authentication...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('User is authenticated:', session.user.id);
          setUserId(session.user.id);
        } else {
          console.log('No authenticated user found');
          // Only show toast if we're not on the initial load
          if (!isLoading) {
            toast({
              title: "Authentication required",
              description: "Please log in to access this feature",
              variant: "destructive",
            });
          }
          setUserId(null);
        }
      } catch (error) {
        console.error('Authentication error:', error);
        setUserId(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log('Auth state changed:', _event);
        if (session?.user) {
          console.log('User authenticated:', session.user.id);
          setUserId(session.user.id);
        } else {
          console.log('User signed out');
          setUserId(null);
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { userId, isLoading };
};
