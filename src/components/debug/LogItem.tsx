
import React from 'react';
import { Info, AlertTriangle, AlertCircle, Bug } from 'lucide-react';
import { LogEntry } from './types';

interface LogItemProps {
  log: LogEntry;
}

const LogItem: React.FC<LogItemProps> = ({ log }) => {
  // Function to get icon for log level
  const getLogIcon = (level: 'info' | 'warn' | 'error' | 'debug') => {
    switch (level) {
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      case 'warn': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'debug': return <Bug className="h-4 w-4 text-purple-500" />;
    }
  };

  // Function to format log data for display
  const formatLogData = (data: any) => {
    if (!data) return null;
    
    try {
      return (
        <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      );
    } catch (e) {
      return <span className="text-xs text-muted-foreground">[Complex data]</span>;
    }
  };

  return (
    <div className={`p-2 rounded-md ${
      log.level === 'error' ? 'bg-red-100 dark:bg-red-950/20' : 
      log.level === 'warn' ? 'bg-yellow-100 dark:bg-yellow-950/20' : 
      log.level === 'debug' ? 'bg-purple-100 dark:bg-purple-950/20' :
      'bg-muted/30'
    }`}>
      <div className="flex items-start gap-2">
        {getLogIcon(log.level)}
        <div className="flex-1 overflow-hidden">
          <div className="flex justify-between items-center">
            <span className={`text-xs font-medium ${
              log.level === 'error' ? 'text-red-800 dark:text-red-300' : 
              log.level === 'warn' ? 'text-yellow-800 dark:text-yellow-300' : 
              log.level === 'debug' ? 'text-purple-800 dark:text-purple-300' :
              'text-muted-foreground'
            }`}>
              {log.level.toUpperCase()}
            </span>
            <span className="text-xs text-muted-foreground">
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
          </div>
          <p className="text-sm mt-1 break-words">{log.message}</p>
          {log.data && formatLogData(log.data)}
        </div>
      </div>
    </div>
  );
};

export default LogItem;
