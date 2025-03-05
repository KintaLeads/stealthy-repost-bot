
import React from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, ExternalLink } from "lucide-react";

interface ConnectionErrorAlertProps {
  supabase: boolean;
  telegram: boolean;
  edgeFunction: {
    deployed: boolean;
    error?: string;
  };
  onOpenSupabaseFunctions: () => void;
}

export const ConnectionErrorAlert: React.FC<ConnectionErrorAlertProps> = ({ 
  supabase, 
  telegram, 
  edgeFunction, 
  onOpenSupabaseFunctions 
}) => {
  if (supabase && telegram && edgeFunction.deployed) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mt-4">
      <AlertTitle>Connection Issues Detected</AlertTitle>
      <AlertDescription>
        <div className="mt-2 space-y-2 text-sm">
          {!supabase && (
            <p>• Cannot connect to Supabase. Check your internet connection.</p>
          )}
          {!telegram && (
            <p>• Cannot connect to Telegram services. Check if Telegram is accessible from your network.</p>
          )}
          {!edgeFunction.deployed && (
            <p>• Edge Function issue: {edgeFunction.error}</p>
          )}
        </div>
        
        {!edgeFunction.deployed && (
          <div className="mt-4">
            <Button size="sm" variant="outline" onClick={onOpenSupabaseFunctions} className="flex items-center">
              <ExternalLink className="h-4 w-4 mr-2" />
              Check Edge Functions in Supabase Dashboard
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

interface CorsErrorAlertProps {
  cors: {
    success: boolean;
    error?: string;
  };
}

export const CorsErrorAlert: React.FC<CorsErrorAlertProps> = ({ cors }) => {
  if (cors.success) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mt-4">
      <AlertTitle>CORS Configuration Issues</AlertTitle>
      <AlertDescription>
        <p className="mt-2 text-sm">
          The Edge Function is deployed but CORS is not correctly configured.
          This will prevent your application from calling the Edge Function.
        </p>
        {cors.error && (
          <p className="mt-2 text-sm">Error: {cors.error}</p>
        )}
      </AlertDescription>
    </Alert>
  );
};

interface AllGoodAlertProps {
  supabase: boolean;
  telegram: boolean;
  edgeFunctionDeployed: boolean;
  corsSuccess: boolean;
}

export const AllGoodAlert: React.FC<AllGoodAlertProps> = ({ 
  supabase, 
  telegram, 
  edgeFunctionDeployed, 
  corsSuccess 
}) => {
  if (!supabase || !telegram || !edgeFunctionDeployed || !corsSuccess) {
    return null;
  }

  return (
    <Alert className="mt-4 border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
      <CheckCircle2 className="h-4 w-4" />
      <AlertTitle>All Systems Operational</AlertTitle>
      <AlertDescription>
        Network connectivity, Edge Function deployment, and CORS configuration look good. 
        If you're still experiencing issues, check your API credentials.
      </AlertDescription>
    </Alert>
  );
};
