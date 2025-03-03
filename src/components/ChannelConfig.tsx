
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { Check, RefreshCw, Link, Unlink, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ChannelConfigProps {
  isConnected: boolean;
  onToggleConnection: () => void;
}

interface ChannelPair {
  id: string;
  sourceChannel: string;
  targetChannel: string;
  sourceUsername: string;
  targetUsername: string;
}

const ChannelConfig: React.FC<ChannelConfigProps> = ({ 
  isConnected, 
  onToggleConnection 
}) => {
  const [isAutoRepost, setIsAutoRepost] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [channelPairs, setChannelPairs] = useState<ChannelPair[]>([
    {
      id: '1',
      sourceChannel: '',
      targetChannel: '',
      sourceUsername: '',
      targetUsername: ''
    }
  ]);
  
  const handleChannelPairChange = (index: number, field: keyof ChannelPair, value: string) => {
    const updatedPairs = [...channelPairs];
    updatedPairs[index] = {
      ...updatedPairs[index],
      [field]: value
    };
    setChannelPairs(updatedPairs);
  };
  
  const addChannelPair = () => {
    setChannelPairs([
      ...channelPairs,
      {
        id: Date.now().toString(),
        sourceChannel: '',
        targetChannel: '',
        sourceUsername: '',
        targetUsername: ''
      }
    ]);
  };
  
  const removeChannelPair = (index: number) => {
    if (channelPairs.length === 1) {
      toast({
        title: "Cannot remove",
        description: "You must have at least one channel pair",
        variant: "destructive",
      });
      return;
    }
    
    const updatedPairs = channelPairs.filter((_, i) => i !== index);
    setChannelPairs(updatedPairs);
  };

  const handleSaveConfig = () => {
    // Validate channel configurations
    const emptyFields = channelPairs.some(pair => 
      !pair.sourceChannel || !pair.targetChannel || !pair.targetUsername
    );
    
    if (emptyFields) {
      toast({
        title: "Missing information",
        description: "Please fill all required fields in all channel configurations",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Configuration saved",
        description: `${channelPairs.length} channel${channelPairs.length > 1 ? 's' : ''} configured successfully`,
      });
      setIsLoading(false);
      onToggleConnection();
    }, 1500);
  };

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
              Configure multiple source and target Telegram channels
            </CardDescription>
          </div>
          <Badge variant="outline" className="px-2 py-1">
            {channelPairs.length} {channelPairs.length === 1 ? 'Pair' : 'Pairs'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {channelPairs.map((pair, index) => (
          <div key={pair.id} className="space-y-4 border border-border/50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Channel Pair {index + 1}</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => removeChannelPair(index)}
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
              >
                <Trash2 size={16} />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`sourceChannel-${index}`}>Source Channel</Label>
                  <div className="relative">
                    <Input
                      id={`sourceChannel-${index}`}
                      placeholder="e.g., competitor_channel"
                      value={pair.sourceChannel}
                      onChange={(e) => handleChannelPairChange(index, 'sourceChannel', e.target.value)}
                      className="pl-9 transition-all focus:border-primary/30"
                    />
                    <div className="absolute left-3 top-2.5 text-muted-foreground">
                      <Link size={16} />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`sourceUsername-${index}`}>Competitor Username</Label>
                  <div className="relative">
                    <Input
                      id={`sourceUsername-${index}`}
                      placeholder="e.g., @competitor_name"
                      value={pair.sourceUsername}
                      onChange={(e) => handleChannelPairChange(index, 'sourceUsername', e.target.value)}
                      className="pl-9 transition-all focus:border-primary/30"
                    />
                    <div className="absolute left-3 top-2.5 text-muted-foreground">
                      <span className="text-sm font-medium">@</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={`targetChannel-${index}`}>Your Channel</Label>
                  <div className="relative">
                    <Input
                      id={`targetChannel-${index}`}
                      placeholder="e.g., your_channel"
                      value={pair.targetChannel}
                      onChange={(e) => handleChannelPairChange(index, 'targetChannel', e.target.value)}
                      className="pl-9 transition-all focus:border-primary/30"
                    />
                    <div className="absolute left-3 top-2.5 text-muted-foreground">
                      <Link size={16} />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`targetUsername-${index}`}>Your Username</Label>
                  <div className="relative">
                    <Input
                      id={`targetUsername-${index}`}
                      placeholder="e.g., @your_username"
                      value={pair.targetUsername}
                      onChange={(e) => handleChannelPairChange(index, 'targetUsername', e.target.value)}
                      className="pl-9 transition-all focus:border-primary/30"
                    />
                    <div className="absolute left-3 top-2.5 text-muted-foreground">
                      <span className="text-sm font-medium">@</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={addChannelPair}
          className="w-full border-dashed border-border"
        >
          <Plus size={16} className="mr-2" />
          Add Another Channel Pair
        </Button>
        
        <div className="flex items-center justify-between space-x-2 pt-4">
          <div className="flex flex-col space-y-1">
            <Label htmlFor="autoRepost" className="text-sm font-medium">
              Automatic Reposting
            </Label>
            <span className="text-[13px] text-muted-foreground">
              Automatically repost new messages
            </span>
          </div>
          <Switch
            id="autoRepost"
            checked={isAutoRepost}
            onCheckedChange={setIsAutoRepost}
          />
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={onToggleConnection}
          className="border-border hover:bg-secondary/80 transition-colors"
        >
          {isConnected ? (
            <>
              <Unlink className="mr-2 h-4 w-4" />
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
          onClick={handleSaveConfig} 
          disabled={isLoading}
          className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {isLoading ? (
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

export default ChannelConfig;
