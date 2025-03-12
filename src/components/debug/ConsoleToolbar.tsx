
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download, Clipboard } from 'lucide-react';
import { LogEntry } from './types';

interface ConsoleToolbarProps {
  onRefresh: () => void;
  onClear: () => void;
  autoRefresh: boolean;
  onToggleAutoRefresh: () => void;
  onDownload: () => void;
  onCopyErrors: () => void;
}

const ConsoleToolbar: React.FC<ConsoleToolbarProps> = ({
  onRefresh,
  onClear,
  autoRefresh,
  onToggleAutoRefresh,
  onDownload,
  onCopyErrors
}) => {
  return (
    <div className="flex justify-between p-4 pt-2">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-1" />
          Refresh
        </Button>
        <Button variant="outline" size="sm" onClick={onClear}>
          Clear
        </Button>
        <Button variant="outline" size="sm" onClick={onCopyErrors}>
          <Clipboard className="h-4 w-4 mr-1" />
          Copy Errors
        </Button>
      </div>
      <div className="flex gap-2">
        <Button 
          variant={autoRefresh ? "default" : "outline"} 
          size="sm" 
          onClick={onToggleAutoRefresh}
        >
          {autoRefresh ? "Auto-refresh On" : "Auto-refresh Off"}
        </Button>
        <Button variant="outline" size="sm" onClick={onDownload}>
          <Download className="h-4 w-4 mr-1" />
          Export
        </Button>
      </div>
    </div>
  );
};

export default ConsoleToolbar;
