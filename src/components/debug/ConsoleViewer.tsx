
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X } from 'lucide-react';
import { consoleLogger } from '@/services/telegram/connectionService';
import { LogEntry } from './types';
import LogList from './LogList';
import ConsoleToolbar from './ConsoleToolbar';

const ConsoleViewer: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Refresh logs from the consoleLogger
  const refreshLogs = () => {
    setLogs(consoleLogger.getLogs());
  };

  // Effect to auto-refresh logs
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      refreshLogs();
    }, 1000);

    return () => clearInterval(intervalId);
  }, [autoRefresh]);

  // Filter logs based on selected level
  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.level === filter;
  });

  // Function to clear all logs
  const clearLogs = () => {
    consoleLogger.clearLogs();
    refreshLogs();
  };

  // Function to download logs as JSON
  const downloadLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `telegram-debug-logs-${new Date().toISOString()}.json`);
    linkElement.click();
  };

  if (!isOpen) {
    return (
      <Button 
        className="fixed right-4 bottom-4 z-50" 
        onClick={() => setIsOpen(true)}
      >
        Show Debug Console
      </Button>
    );
  }

  return (
    <Card className="fixed right-4 bottom-4 z-50 w-[600px] max-w-[calc(100vw-2rem)] shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Debug Console</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <Tabs defaultValue="all" className="w-full">
        <div className="px-6 pb-2">
          <TabsList className="grid grid-cols-4 mb-2">
            <TabsTrigger value="all" onClick={() => setFilter('all')}>All</TabsTrigger>
            <TabsTrigger value="info" onClick={() => setFilter('info')}>Info</TabsTrigger>
            <TabsTrigger value="warn" onClick={() => setFilter('warn')}>Warnings</TabsTrigger>
            <TabsTrigger value="error" onClick={() => setFilter('error')}>Errors</TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="p-0">
          <TabsContent value="all" className="m-0">
            <LogList logs={filteredLogs} />
          </TabsContent>
          
          <TabsContent value="info" className="m-0">
            <LogList logs={filteredLogs} />
          </TabsContent>
          
          <TabsContent value="warn" className="m-0">
            <LogList logs={filteredLogs} />
          </TabsContent>
          
          <TabsContent value="error" className="m-0">
            <LogList logs={filteredLogs} />
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="p-0">
        <ConsoleToolbar
          onRefresh={refreshLogs}
          onClear={clearLogs}
          autoRefresh={autoRefresh}
          onToggleAutoRefresh={() => setAutoRefresh(!autoRefresh)}
          onDownload={downloadLogs}
        />
      </CardFooter>
    </Card>
  );
};

export default ConsoleViewer;
