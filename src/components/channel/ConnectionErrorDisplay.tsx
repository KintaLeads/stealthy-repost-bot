
import React from 'react';

interface ConnectionErrorDisplayProps {
  error: string | null;
  details?: any; // Add support for detailed error information
}

const ConnectionErrorDisplay: React.FC<ConnectionErrorDisplayProps> = ({ error, details }) => {
  if (!error) return null;
  
  // Extract possible API ID/Hash errors for clearer display
  const isApiIdError = error.includes('API ID');
  const isApiHashError = error.includes('API Hash');
  const isEdgeFunctionError = error.includes('Edge Function') || error.includes('FunctionsHttpError');
  const isNetworkError = error.includes('network') || error.includes('Failed to fetch');
  const isCredentialsError = isApiIdError || isApiHashError || error.includes('credentials');
  
  return (
    <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-md p-3 text-sm mb-4">
      <strong className="font-semibold">Connection Error:</strong> {error}
      
      {details && (
        <div className="mt-1 text-xs opacity-80">
          <strong>Details:</strong> {typeof details === 'object' ? JSON.stringify(details) : details}
        </div>
      )}
      
      {isCredentialsError && (
        <div className="mt-2 text-xs">
          <p>Check that your Telegram API credentials are correct:</p>
          <ul className="list-disc pl-5 mt-1">
            {isApiIdError && <li>API ID must be a valid number (e.g., "12345678")</li>}
            {isApiHashError && <li>API Hash must be a 32-character string</li>}
            <li>Make sure there are no extra spaces before or after credentials</li>
            <li>Verify that you're using the API ID and hash from <a href="https://my.telegram.org/apps" target="_blank" rel="noopener noreferrer" className="underline">https://my.telegram.org/apps</a></li>
          </ul>
        </div>
      )}
      
      {isEdgeFunctionError && (
        <div className="mt-2 text-xs">
          <p>The Edge Function encountered an error:</p>
          <ul className="list-disc pl-5 mt-1">
            <li>Check the Edge Function logs in Supabase</li>
            <li>Verify that your Supabase server is running properly</li>
            <li>Make sure the edge function has the necessary permissions</li>
            <li>Verify that all required environment variables are set in the Supabase dashboard</li>
          </ul>
        </div>
      )}

      {isNetworkError && (
        <div className="mt-2 text-xs">
          <p>There seems to be a network connectivity issue:</p>
          <ul className="list-disc pl-5 mt-1">
            <li>Check your internet connection</li>
            <li>Make sure CORS is properly configured in the Edge Function</li>
            <li>Verify that the Supabase URL is correct and accessible</li>
            <li>Try opening the browser console (F12) and check for detailed network error messages</li>
          </ul>
        </div>
      )}

      {!isCredentialsError && !isEdgeFunctionError && !isNetworkError && (
        <div className="mt-2 text-xs">
          <p>Troubleshooting steps:</p>
          <ul className="list-disc pl-5 mt-1">
            <li>Check the Edge Function logs in Supabase for detailed error information</li>
            <li>Verify your Telegram API credentials</li>
            <li>Make sure all required environment variables are set</li>
            <li>Try again in a few minutes as Telegram may have rate-limiting in place</li>
            <li>Open the browser console (F12) to check for more detailed error messages</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ConnectionErrorDisplay;
