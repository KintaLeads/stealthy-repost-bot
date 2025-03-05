
import React from 'react';
import StatusSummary from './StatusSummary';
import CorsDetails from './CorsDetails';
import { ConnectionErrorAlert, CorsErrorAlert, AllGoodAlert } from './DiagnosticAlert';
import FunctionUrlDisplay from './FunctionUrlDisplay';
import { DiagnosticResultData } from './types';

interface DiagnosticResultsProps {
  results: DiagnosticResultData;
  onOpenSupabaseFunctions: () => void;
}

const DiagnosticResults: React.FC<DiagnosticResultsProps> = ({ 
  results, 
  onOpenSupabaseFunctions 
}) => {
  return (
    <div className="space-y-4">
      <StatusSummary results={results} />
      
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
        <FunctionUrlDisplay url={results.edgeFunction.url} />
      )}
    </div>
  );
};

export default DiagnosticResults;
