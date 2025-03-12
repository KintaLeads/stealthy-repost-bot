
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { runConnectivityChecks } from '@/services/telegram/networkConnectivity';
import StatusSummary from './StatusSummary';
import DiagnosticResults from './DiagnosticResults';
import DiagnosticActions from './DiagnosticActions';
import CorsDetails from './CorsDetails';
import EdgeFunctionTester from './EdgeFunctionTester';
import { DiagnosticResultData } from './types';

const DiagnosticTool: React.FC = () => {
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticResultData | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  
  const openSupabaseFunctions = () => {
    // Open Supabase Functions in a new tab
    window.open('https://app.supabase.com/project/_/functions', '_blank');
  };
  
  const runDiagnosticChecks = async () => {
    setIsChecking(true);
    try {
      // Pass an empty object as the argument to runConnectivityChecks if needed
      const results = await runConnectivityChecks({});
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
      {diagnosticResults && <StatusSummary results={diagnosticResults} />}
      
      <Tabs defaultValue="details">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Detailed Results</TabsTrigger>
          <TabsTrigger value="edge">Edge Functions</TabsTrigger>
          <TabsTrigger value="cors">CORS Details</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-4">
          {diagnosticResults && (
            <DiagnosticResults 
              results={diagnosticResults} 
              onOpenSupabaseFunctions={openSupabaseFunctions}
            />
          )}
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
