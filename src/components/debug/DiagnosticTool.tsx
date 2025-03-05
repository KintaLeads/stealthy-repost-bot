
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, XCircle, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { runConnectivityChecks } from "@/services/telegram";

const DiagnosticTool: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<null | {
    supabase: boolean;
    telegram: boolean;
    edgeFunction: {
      deployed: boolean;
      error?: string;
    };
  }>(null);

  const runChecks = async () => {
    setIsRunning(true);
    try {
      // The project ID is hardcoded for now, but could be made configurable
      const projectId = "eswfrzdqxsaizkdswxfn";
      const checkResults = await runConnectivityChecks(projectId);
      setResults(checkResults);
    } catch (error) {
      console.error("Error running diagnostics:", error);
    } finally {
      setIsRunning(false);
    }
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
          <div className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <span>Supabase Connectivity</span>
                </div>
                {results.supabase ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <span>Telegram API Connectivity</span>
                </div>
                {results.telegram ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <span>Edge Function Deployment</span>
                </div>
                {results.edgeFunction.deployed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            </div>
            
            {(!results.supabase || !results.telegram || !results.edgeFunction.deployed) && (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>Connection Issues Detected</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 space-y-2 text-sm">
                    {!results.supabase && (
                      <p>• Cannot connect to Supabase. Check your internet connection.</p>
                    )}
                    {!results.telegram && (
                      <p>• Cannot connect to Telegram services. Check if Telegram is accessible from your network.</p>
                    )}
                    {!results.edgeFunction.deployed && (
                      <p>• Edge Function issue: {results.edgeFunction.error}</p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            {results.supabase && results.telegram && results.edgeFunction.deployed && (
              <Alert className="mt-4 border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>All Systems Operational</AlertTitle>
                <AlertDescription>
                  Network connectivity and Edge Function deployment look good. If you're still experiencing issues, check your API credentials.
                </AlertDescription>
              </Alert>
            )}
          </div>
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
