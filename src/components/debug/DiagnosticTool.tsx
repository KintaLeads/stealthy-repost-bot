import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { runConnectivityChecks } from '@/services/telegram/networkConnectivity';
import StatusSummary from './StatusSummary';
import DiagnosticResults from './DiagnosticResults';
import DiagnosticActions from './DiagnosticActions';
import CorsDetails from './CorsDetails';
import EdgeFunctionTester from './EdgeFunctionTester';

interface DiagnosticResultsType {
  supabase: boolean;
  telegram: boolean;
  edgeFunction: {
    deployed: boolean;
    url: string;
    error: string;
    connector: {
      available: boolean;
      response: any;
    };
    realtime: {
      available: boolean;
      response: any;
    };
  };
}

const DiagnosticTool: React.FC = () => {
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResultsType | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  
  const runDiagnosticChecks = async () => {
    setIsChecking(true);
    try {
      const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID || '';
      const results = await runConnectivityChecks(projectId);
      setDiagnosticResults(results);
    } catch (error) {
      console.error("Error running diagnostic checks:", error);
    } finally {
      setIsChecking(false);
    }
  };
  
  useEffect(() => {
    runDiagnosticChecks();
  }, []);
  
  return (
    <div className="space-y-4">
      <StatusSummary results={diagnosticResults} isLoading={isChecking} />
      
      <Tabs defaultValue="details">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Detailed Results</TabsTrigger>
          <TabsTrigger value="edge">Edge Functions</TabsTrigger>
          <TabsTrigger value="cors">CORS Details</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-4">
          <DiagnosticResults results={diagnosticResults} isLoading={isChecking} />
        </TabsContent>
        
        <TabsContent value="edge" className="space-y-4">
          <EdgeFunctionTester />
        </TabsContent>
        
        <TabsContent value="cors" className="space-y-4">
          <CorsDetails />
        </TabsContent>
      </Tabs>
      
      <DiagnosticActions 
        onRunChecks={runDiagnosticChecks} 
        isChecking={isChecking}
      />
    </div>
  );
};

export default DiagnosticTool;
