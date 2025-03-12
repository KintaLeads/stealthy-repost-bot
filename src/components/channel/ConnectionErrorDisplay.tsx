
import React from 'react';

interface ConnectionErrorDisplayProps {
  error: string | null;
}

const ConnectionErrorDisplay: React.FC<ConnectionErrorDisplayProps> = ({ error }) => {
  if (!error) return null;
  
  // Extract possible API ID/Hash errors for clearer display
  const isApiIdError = error.includes('API ID');
  const isApiHashError = error.includes('API Hash');
  const isEdgeFunctionError = error.includes('Edge Function');
  const isCredentialsError = isApiIdError || isApiHashError || error.includes('credentials');
  
  return (
    <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-md p-3 text-sm mb-4">
      <strong>Connection Error:</strong> {error}
      
      {isCredentialsError && (
        <div className="mt-2 text-xs">
          <p>Check that your Telegram API credentials are correct:</p>
          <ul className="list-disc pl-5 mt-1">
            {isApiIdError && <li>API ID must be a valid number (e.g., "12345678")</li>}
            {isApiHashError && <li>API Hash must be a 32-character string</li>}
            <li>Make sure there are no extra spaces before or after credentials</li>
          </ul>
        </div>
      )}
      
      {isEdgeFunctionError && (
        <div className="mt-2 text-xs">
          <p>The Edge Function encountered an error:</p>
          <ul className="list-disc pl-5 mt-1">
            <li>Check that your Supabase Edge Functions are deployed correctly</li>
            <li>Verify that the function has the necessary permissions</li>
            <li>Check Edge Function logs for details on the specific error</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ConnectionErrorDisplay;
