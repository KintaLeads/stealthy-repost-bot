
import React from 'react';
import DiagnosticItem from './DiagnosticItem';
import CorsDetails from './CorsDetails';
import { ConnectionErrorAlert, CorsErrorAlert, AllGoodAlert } from './DiagnosticAlert';
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface DiagnosticResultsProps {
  results: {
    supabase: boolean;
    telegram: boolean;
    edgeFunction: {
      deployed: boolean;
      url: string;
      error?: string;
    };
    cors?: {
      success: boolean;
      status?: number;
      corsHeaders?: Record<string, string | null>;
      error?: string;
      postTest?: {
        success: boolean;
        status?: number;
        error?: string;
      };
    };
  };
  onOpenSupabaseFunctions: () => void;
}

const DiagnosticResults: React.FC<DiagnosticResultsProps> = ({ results, onOpenSupabaseFunctions }) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        <DiagnosticItem
          label="Supabase Connectivity"
          isSuccess={results.supabase}
        />
        
        <DiagnosticItem
          label="Telegram API Connectivity"
          isSuccess={results.telegram}
        />
        
        <DiagnosticItem
          label="Edge Function Deployment"
          isSuccess={results.edgeFunction.deployed}
        />
        
        {results.cors && (
          <DiagnosticItem
            label="CORS Configuration"
            isSuccess={results.cors.success}
          />
        )}
      </div>
      
      {results.edgeFunction.deployed && results.cors && (
        <CorsDetails
          status={results.cors.status}
          corsHeaders={results.cors.corsHeaders}
          postTest={results.cors.postTest}
        />
      )}
      
      <ConnectionErrorAlert
        supabase={results.supabase}
        telegram={results.telegram}
        edgeFunction={results.edgeFunction}
        onOpenSupabaseFunctions={onOpenSupabaseFunctions}
      />
      
      {results.cors && (
        <CorsErrorAlert cors={results.cors} />
      )}
      
      <AllGoodAlert
        supabase={results.supabase}
        telegram={results.telegram}
        edgeFunctionDeployed={results.edgeFunction.deployed}
        corsSuccess={!results.cors || results.cors.success}
      />
      
      {results.edgeFunction.url && (
        <div className="text-xs text-muted-foreground text-center w-full">
          Edge Function URL: {results.edgeFunction.url}
        </div>
      )}
    </div>
  );
};

export default DiagnosticResults;
