
import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface DiagnosticActionsProps {
  onRunChecks: () => void;
  isChecking: boolean;
}

const DiagnosticActions: React.FC<DiagnosticActionsProps> = ({ 
  onRunChecks, 
  isChecking 
}) => {
  return (
    <div className="flex justify-end">
      <Button
        variant="outline"
        onClick={onRunChecks}
        disabled={isChecking}
        className="flex items-center"
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
        {isChecking ? "Running diagnostics..." : "Run Diagnostics"}
      </Button>
    </div>
  );
};

export default DiagnosticActions;
