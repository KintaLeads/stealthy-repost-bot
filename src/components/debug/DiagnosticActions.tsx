
import React from 'react';
import { Button } from "@/components/ui/button";
import { ActivityIcon } from "lucide-react";

interface DiagnosticActionsProps {
  onRunChecks: () => void;
  isChecking: boolean;
}

const DiagnosticActions: React.FC<DiagnosticActionsProps> = ({ 
  onRunChecks, 
  isChecking 
}) => {
  return (
    <Button
      variant="outline"
      onClick={onRunChecks}
      disabled={isChecking}
      className="flex items-center"
    >
      <ActivityIcon className="mr-2 h-4 w-4" />
      {isChecking ? "Running Diagnostics..." : "Run Diagnostics Again"}
    </Button>
  );
};

export default DiagnosticActions;
