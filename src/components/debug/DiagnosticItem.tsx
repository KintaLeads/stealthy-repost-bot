
import React from 'react';
import { CheckCircle2, XCircle } from "lucide-react";

interface DiagnosticItemProps {
  label: string;
  isSuccess: boolean;
}

const DiagnosticItem: React.FC<DiagnosticItemProps> = ({ label, isSuccess }) => {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-2">
        <span>{label}</span>
      </div>
      {isSuccess ? (
        <CheckCircle2 className="h-5 w-5 text-green-500" />
      ) : (
        <XCircle className="h-5 w-5 text-red-500" />
      )}
    </div>
  );
};

export default DiagnosticItem;
