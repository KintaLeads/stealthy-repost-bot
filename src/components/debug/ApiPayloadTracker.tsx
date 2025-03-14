
import React from 'react';
import { consoleLogger } from '@/services/telegram/debugger';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

const ApiPayloadTracker: React.FC = () => {
  const [refresh, setRefresh] = React.useState(0);
  const payloads = consoleLogger.getApiPayloads();
  
  // Function to force refresh
  const handleRefresh = () => {
    setRefresh(prev => prev + 1);
  };
  
  if (payloads.length === 0) {
    return (
      <div className="p-4 text-center space-y-4">
        <div className="text-muted-foreground">
          No API payloads have been tracked yet. Perform an operation that uses API credentials.
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1">
        <span className="text-sm text-muted-foreground">
          Showing {payloads.length} tracked API credential operations
        </span>
        <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>
      
      <ScrollArea className="h-[300px] w-full">
        <div className="p-1 space-y-2">
          {payloads.map((payload, index) => (
            <PayloadCard key={index} payload={payload} index={index} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

const PayloadCard: React.FC<{ payload: any; index: number }> = ({ payload, index }) => {
  const { timestamp, filePath, functionName, stage, apiId, apiHash, phoneNumber, otherData } = payload;
  
  // Format time
  const formattedTime = new Date(timestamp).toLocaleTimeString();
  
  // Determine badges based on types
  const apiIdTypeBadge = getBadgeVariant(apiId.type);
  const apiHashTypeBadge = getBadgeVariant(apiHash.type);
  const phoneNumberTypeBadge = getBadgeVariant(phoneNumber?.type || 'undefined');
  
  // Format file path for better display
  const shortFilePath = getShortFileName(filePath);
  
  // Highlight stages with different colors
  const stageBadgeVariant = getStageBadgeVariant(stage);
  
  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-2 text-xs">
        <div className="flex justify-between items-start mb-1">
          <div className="flex items-center gap-1">
            <span className="font-bold">{formattedTime}</span>
            <Badge variant={stageBadgeVariant} className="text-[10px] h-4 ml-1">
              {stage}
            </Badge>
          </div>
          <span className="text-muted-foreground">#{index + 1}</span>
        </div>
        
        <div className="mb-1">
          <div className="font-medium text-xs">{shortFilePath}</div>
          <div className="text-muted-foreground text-[10px]">{functionName}</div>
        </div>
        
        <div className="grid grid-cols-3 gap-1 mt-2">
          <div>
            <div className="flex gap-1 items-center">
              <span>API ID:</span>
              <Badge variant={apiIdTypeBadge} className="text-[10px] h-4">
                {apiId.type}
              </Badge>
            </div>
            <div className="bg-muted/50 rounded px-1 py-0.5 mt-0.5 font-mono text-[10px] break-all">
              {String(apiId.value)}
            </div>
          </div>
          
          <div>
            <div className="flex gap-1 items-center">
              <span>API Hash:</span>
              <Badge variant={apiHashTypeBadge} className="text-[10px] h-4">
                {apiHash.type}
              </Badge>
            </div>
            <div className="bg-muted/50 rounded px-1 py-0.5 mt-0.5 font-mono text-[10px] break-all">
              {apiHash.value}
            </div>
          </div>
          
          <div>
            <div className="flex gap-1 items-center">
              <span>Phone:</span>
              <Badge variant={phoneNumberTypeBadge} className="text-[10px] h-4">
                {phoneNumber?.type || 'undefined'}
              </Badge>
            </div>
            <div className="bg-muted/50 rounded px-1 py-0.5 mt-0.5 font-mono text-[10px] break-all">
              {phoneNumber?.value || 'missing'}
            </div>
          </div>
        </div>
        
        {otherData && (
          <div className="mt-1">
            <div className="text-[10px] text-muted-foreground">Additional Data:</div>
            <div className="bg-muted/50 rounded px-1 py-0.5 mt-0.5 font-mono text-[10px] break-all">
              {JSON.stringify(otherData)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Helper function to get shortened file name
const getShortFileName = (filePath: string): string => {
  const parts = filePath.split('/');
  return parts[parts.length - 1];
};

// Helper function to get badge variant based on type
const getBadgeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (type) {
    case 'string':
      return 'secondary';
    case 'number':
      return 'default';
    case 'undefined':
    case 'null':
      return 'destructive';
    default:
      return 'outline';
  }
};

// Helper function to get badge variant based on stage
const getStageBadgeVariant = (stage: string): "default" | "secondary" | "destructive" | "outline" => {
  if (stage.includes('start')) return 'secondary';
  if (stage.includes('validated')) return 'default';
  if (stage.includes('error')) return 'destructive';
  if (stage.includes('before')) return 'outline';
  if (stage.includes('after')) return 'default';
  return 'outline';
};

export default ApiPayloadTracker;
