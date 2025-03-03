
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Link, Check } from "lucide-react";
import { ApiAccount } from "@/types/channels";
import EmptyChannelState from "./channel/EmptyChannelState";
import ChannelPairsList from "./channel/ChannelPairsList";
import { useChannelPairs } from "@/hooks/useChannelPairs";

interface ChannelPairManagerProps {
  selectedAccount: ApiAccount | null;
  isConnected: boolean;
  onToggleConnection: () => void;
}

const ChannelPairManager: React.FC<ChannelPairManagerProps> = ({ 
  selectedAccount, 
  isConnected,
  onToggleConnection
}) => {
  const {
    channelPairs,
    isLoading,
    isSaving,
    isAutoRepost,
    setIsAutoRepost,
    handleChannelPairChange,
    addChannelPair,
    removeChannelPair,
    saveChannelPairs
  } = useChannelPairs(selectedAccount);
  
  if (!selectedAccount) {
    return <EmptyChannelState />;
  }
  
  return (
    <Card className="w-full glass-card animate-slide-up">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl flex items-center">
              <span>Channel Configuration</span>
              {isConnected && (
                <Badge className="ml-2 flex items-center gap-1.5 text-xs font-normal text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 py-0.5 px-2 rounded-full">
                  <Check size={14} />
                  <span>Connected</span>
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Configure channel pairs for <strong>{selectedAccount.nickname}</strong>
            </CardDescription>
          </div>
          <Badge variant="outline" className="px-2 py-1">
            {channelPairs.length} {channelPairs.length === 1 ? 'Pair' : 'Pairs'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <ChannelPairsList
          channelPairs={channelPairs}
          isLoading={isLoading}
          isAutoRepost={isAutoRepost}
          setIsAutoRepost={setIsAutoRepost}
          onChannelPairChange={handleChannelPairChange}
          onChannelPairRemove={removeChannelPair}
          onChannelPairAdd={addChannelPair}
        />
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={onToggleConnection}
          className="border-border hover:bg-secondary/80 transition-colors"
          disabled={isSaving || channelPairs.length === 0}
        >
          {isConnected ? (
            <>
              <Link className="mr-2 h-4 w-4" />
              Disconnect
            </>
          ) : (
            <>
              <Link className="mr-2 h-4 w-4" />
              Connect
            </>
          )}
        </Button>
        
        <Button 
          onClick={saveChannelPairs} 
          disabled={isSaving || channelPairs.length === 0}
          className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {isSaving ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Configuration'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ChannelPairManager;
