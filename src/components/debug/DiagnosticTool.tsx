
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { runConnectivityChecks, testCorsConfiguration } from "@/services/telegram";
import DiagnosticResults from './DiagnosticResults';
import { DiagnosticResultData } from './types';

const DiagnosticTool: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResultData | null>(null);

  const runChecks = async () => {
    setIsRunning(true);
    try {
      // The project ID is hardcoded for now, but could be made configurable
      const projectId = "eswfrzdqxsaizkdswxfn";
      
      // Run connectivity checks first
      const checkResults = await runConnectivityChecks(projectId);
      
      // If edge function is deployed, also test CORS
      let corsResults = undefined;
      if (checkResults.edgeFunction.deployed) {
        corsResults = await testCorsConfiguration(projectId);
      }
      
      setResults({
        ...checkResults,
        cors: corsResults
      });
      
      // Log full diagnostics results for debugging
      console.log("Full diagnostics results:", {
        supabase: checkResults.supabase,
        telegram: checkResults.telegram,
        edgeFunction: checkResults.edgeFunction,
        cors: corsResults
      });
    } catch (error) {
      console.error("Error running diagnostics:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const openSupabaseFunctions = () => {
    window.open('https://supabase.com/dashboard/project/eswfrzdqxsaizkdswxfn/functions', '_blank');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Telegram Connection Diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!results ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">
              Run the diagnostics to check your Telegram API connection
            </p>
          </div>
        ) : (
          <DiagnosticResults 
            results={results} 
            onOpenSupabaseFunctions={openSupabaseFunctions} 
          />
        )}
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={runChecks} 
          disabled={isRunning}
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Diagnostics...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              {results ? "Run Diagnostics Again" : "Run Diagnostics"}
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DiagnosticTool;
