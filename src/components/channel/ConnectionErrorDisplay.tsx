
import React from 'react';

interface ConnectionErrorDisplayProps {
  error: string | null;
}

const ConnectionErrorDisplay: React.FC<ConnectionErrorDisplayProps> = ({ error }) => {
  if (!error) return null;
  
  return (
    <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-md p-3 text-sm mb-4">
      <strong>Connection Error:</strong> {error}
    </div>
  );
};

export default ConnectionErrorDisplay;
