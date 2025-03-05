
import React from 'react';
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DiagnosticActionsProps {
  showDiagnosticTool: boolean;
  runDiagnostics: () => void;
}

const DiagnosticActions: React.FC<DiagnosticActionsProps> = ({ 
  showDiagnosticTool, 
  runDiagnostics 
}) => {
  return (
    <Button
      variant="outline"
      onClick={runDiagnostics}
      className="flex items-center"
    >
      <AlertTriangle className="mr-2 h-4 w-4" />
      {showDiagnosticTool ? "Run Diagnostics Again" : "Run Connection Diagnostics"}
    </Button>
  );
};

export default DiagnosticActions;
