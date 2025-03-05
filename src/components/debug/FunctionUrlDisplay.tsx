
import React from 'react';

interface FunctionUrlDisplayProps {
  url: string;
}

const FunctionUrlDisplay: React.FC<FunctionUrlDisplayProps> = ({ url }) => {
  if (!url) return null;
  
  return (
    <div className="text-xs text-muted-foreground text-center w-full">
      Edge Function URL: {url}
    </div>
  );
};

export default FunctionUrlDisplay;
