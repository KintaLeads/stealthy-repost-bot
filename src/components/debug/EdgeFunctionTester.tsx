
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { logInfo, logError } from '@/services/telegram/debugger';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const EdgeFunctionTester: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Record<string, any> | null>(null);
  
  const testEdgeFunction = async (functionName: string) => {
    setLoading(true);
    setResults(null);
    
    try {
      logInfo('EdgeFunctionTester', `Testing edge function: ${functionName}`);
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { operation: 'healthcheck' }
      });
      
      if (error) {
        logError('EdgeFunctionTester', `Error calling ${functionName}:`, error);
        setResults({
          success: false,
          error: error.message || `Failed to call ${functionName}`,
          details: error
        });
        
        toast({
          title: "Edge Function Test Failed",
          description: `Could not reach ${functionName}: ${error.message}`,
          variant: "destructive"
        });
      } else {
        logInfo('EdgeFunctionTester', `${functionName} responded successfully:`, data);
        setResults({
          success: true,
          data,
          functionName
        });
        
        toast({
          title: "Edge Function Test Successful",
          description: `Successfully connected to ${functionName}`,
        });
      }
    } catch (error) {
      logError('EdgeFunctionTester', `Exception testing ${functionName}:`, error);
      setResults({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        exception: true
      });
      
      toast({
        title: "Edge Function Test Exception",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Edge Function Tester</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button 
            onClick={() => testEdgeFunction('telegram-connector')} 
            disabled={loading}
            variant="outline"
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Test telegram-connector
          </Button>
          
          <Button 
            onClick={() => testEdgeFunction('telegram-realtime')} 
            disabled={loading}
            variant="outline"
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Test telegram-realtime
          </Button>
        </div>
        
        {results && (
          <div className="mt-4 p-4 bg-muted rounded-md">
            <h4 className="text-sm font-medium mb-2">Results</h4>
            <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-[300px]">
              {JSON.stringify(results, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Use this tool to verify that edge functions are accessible
      </CardFooter>
    </Card>
  );
};

export default EdgeFunctionTester;
