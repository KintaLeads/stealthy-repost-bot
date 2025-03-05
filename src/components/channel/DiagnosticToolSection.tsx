
import React from 'react';
import DiagnosticTool from '../debug/DiagnosticTool';

interface DiagnosticToolSectionProps {
  showDiagnosticTool: boolean;
}

const DiagnosticToolSection: React.FC<DiagnosticToolSectionProps> = ({
  showDiagnosticTool
}) => {
  if (!showDiagnosticTool) {
    return null;
  }

  return <DiagnosticTool />;
};

export default DiagnosticToolSection;
