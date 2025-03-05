
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, XCircle, AlertTriangle, Loader2, RefreshCw, ExternalLink } from "lucide-react";
import { runConnectivityChecks, testCorsConfiguration } from "@/services/telegram";

const DiagnosticTool: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<null | {
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
  }>(null);

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
              
              {results.cors && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <span>CORS Configuration</span>
                  </div>
                  {results.cors.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
              )}
            </div>
            
            {results.edgeFunction.deployed && results.cors && (
              <div className="mt-4 p-3 bg-muted rounded-lg text-xs">
                <h4 className="font-medium mb-2">CORS Details:</h4>
                <p>Status: {results.cors.status}</p>
                {results.cors.corsHeaders && (
                  <div className="mt-2">
                    <p>Allow Origin: {results.cors.corsHeaders['Access-Control-Allow-Origin'] || 'Not set'}</p>
                    <p>Allow Methods: {results.cors.corsHeaders['Access-Control-Allow-Methods'] || 'Not set'}</p>
                    <p>Allow Headers: {results.cors.corsHeaders['Access-Control-Allow-Headers'] || 'Not set'}</p>
                  </div>
                )}
                {results.cors.postTest && (
                  <div className="mt-2">
                    <p>POST Test: {results.cors.postTest.success ? 'Successful' : 'Failed'}</p>
                    {results.cors.postTest.status && <p>Status: {results.cors.postTest.status}</p>}
                    {results.cors.postTest.error && <p>Error: {results.cors.postTest.error}</p>}
                  </div>
                )}
              </div>
            )}
            
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
                  
                  {!results.edgeFunction.deployed && (
                    <div className="mt-4">
                      <Button size="sm" variant="outline" onClick={openSupabaseFunctions} className="flex items-center">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Check Edge Functions in Supabase Dashboard
                      </Button>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
            
            {results.cors && !results.cors.success && (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>CORS Configuration Issues</AlertTitle>
                <AlertDescription>
                  <p className="mt-2 text-sm">
                    The Edge Function is deployed but CORS is not correctly configured.
                    This will prevent your application from calling the Edge Function.
                  </p>
                  {results.cors.error && (
                    <p className="mt-2 text-sm">Error: {results.cors.error}</p>
                  )}
                </AlertDescription>
              </Alert>
            )}
            
            {results.supabase && results.telegram && results.edgeFunction.deployed && 
             (!results.cors || results.cors.success) && (
              <Alert className="mt-4 border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>All Systems Operational</AlertTitle>
                <AlertDescription>
                  Network connectivity, Edge Function deployment, and CORS configuration look good. 
                  If you're still experiencing issues, check your API credentials.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-3">
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
        
        {results && results.edgeFunction.url && (
          <div className="text-xs text-muted-foreground text-center w-full">
            Edge Function URL: {results.edgeFunction.url}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default DiagnosticTool;
