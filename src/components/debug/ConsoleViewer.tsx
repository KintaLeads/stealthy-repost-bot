
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { debugger } from '@/services/telegram/connectionService';
import { X, RefreshCw, AlertTriangle, Info, AlertCircle, Download } from 'lucide-react';

interface LogEntry {
  level: 'info' | 'warn' | 'error';
  timestamp: Date;
  message: string;
  data?: any;
}

const ConsoleViewer: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Refresh logs from the debugger
  const refreshLogs = () => {
    setLogs(debugger.getLogs());
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
    debugger.clearLogs();
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

  // Function to get icon for log level
  const getLogIcon = (level: 'info' | 'warn' | 'error') => {
    switch (level) {
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      case 'warn': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
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
            <ScrollArea className="h-[400px] px-6">
              {filteredLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <p>No logs to display</p>
                </div>
              ) : (
                <div className="space-y-2 py-2">
                  {filteredLogs.map((log, index) => (
                    <div key={index} className={`p-2 rounded-md ${
                      log.level === 'error' ? 'bg-red-100 dark:bg-red-950/20' : 
                      log.level === 'warn' ? 'bg-yellow-100 dark:bg-yellow-950/20' : 
                      'bg-muted/30'
                    }`}>
                      <div className="flex items-start gap-2">
                        {getLogIcon(log.level)}
                        <div className="flex-1 overflow-hidden">
                          <div className="flex justify-between items-center">
                            <span className={`text-xs font-medium ${
                              log.level === 'error' ? 'text-red-800 dark:text-red-300' : 
                              log.level === 'warn' ? 'text-yellow-800 dark:text-yellow-300' : 
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
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="info" className="m-0">
            {/* Same content as "all" but filtered for info */}
            <ScrollArea className="h-[400px] px-6">
              {/* ... same structure */}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="warn" className="m-0">
            {/* Same content as "all" but filtered for warnings */}
            <ScrollArea className="h-[400px] px-6">
              {/* ... same structure */}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="error" className="m-0">
            {/* Same content as "all" but filtered for errors */}
            <ScrollArea className="h-[400px] px-6">
              {/* ... same structure */}
            </ScrollArea>
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="flex justify-between p-4 pt-2">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshLogs}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={clearLogs}>
            Clear
          </Button>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={autoRefresh ? "default" : "outline"} 
            size="sm" 
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? "Auto-refresh On" : "Auto-refresh Off"}
          </Button>
          <Button variant="outline" size="sm" onClick={downloadLogs}>
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ConsoleViewer;
