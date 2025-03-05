
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import LogItem from './LogItem';
import { LogEntry } from './types';

interface LogListProps {
  logs: LogEntry[];
}

const LogList: React.FC<LogListProps> = ({ logs }) => {
  return (
    <ScrollArea className="h-[400px] px-6">
      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <p>No logs to display</p>
        </div>
      ) : (
        <div className="space-y-2 py-2">
          {logs.map((log, index) => (
            <LogItem key={index} log={log} />
          ))}
        </div>
      )}
    </ScrollArea>
  );
};

export default LogList;
