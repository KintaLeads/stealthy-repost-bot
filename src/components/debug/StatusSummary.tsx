
import React from 'react';
import DiagnosticItem from './DiagnosticItem';
import { DiagnosticResultData } from './types';

interface StatusSummaryProps {
  results: DiagnosticResultData;
}

const StatusSummary: React.FC<StatusSummaryProps> = ({ results }) => {
  return (
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
  );
};

export default StatusSummary;
