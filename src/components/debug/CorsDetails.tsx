
import React from 'react';

interface CorsDetailsProps {
  status?: number;
  corsHeaders?: Record<string, string | null>;
  postTest?: {
    success: boolean;
    status?: number;
    error?: string;
  };
}

const CorsDetails: React.FC<CorsDetailsProps> = ({ status, corsHeaders, postTest }) => {
  return (
    <div className="mt-4 p-3 bg-muted rounded-lg text-xs">
      <h4 className="font-medium mb-2">CORS Details:</h4>
      <p>Status: {status}</p>
      {corsHeaders && (
        <div className="mt-2">
          <p>Allow Origin: {corsHeaders['Access-Control-Allow-Origin'] || 'Not set'}</p>
          <p>Allow Methods: {corsHeaders['Access-Control-Allow-Methods'] || 'Not set'}</p>
          <p>Allow Headers: {corsHeaders['Access-Control-Allow-Headers'] || 'Not set'}</p>
        </div>
      )}
      {postTest && (
        <div className="mt-2">
          <p>POST Test: {postTest.success ? 'Successful' : 'Failed'}</p>
          {postTest.status && <p>Status: {postTest.status}</p>}
          {postTest.error && <p>Error: {postTest.error}</p>}
        </div>
      )}
    </div>
  );
};

export default CorsDetails;
