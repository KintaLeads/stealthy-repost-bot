
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { Check, RefreshCw, Link, Unlink } from "lucide-react";

interface ChannelConfigProps {
  isConnected: boolean;
  onToggleConnection: () => void;
}

const ChannelConfig: React.FC<ChannelConfigProps> = ({ 
  isConnected, 
  onToggleConnection 
}) => {
  const [sourceChannel, setSourceChannel] = useState('');
  const [targetChannel, setTargetChannel] = useState('');
  const [sourceUsername, setSourceUsername] = useState('');
  const [targetUsername, setTargetUsername] = useState('');
  const [isAutoRepost, setIsAutoRepost] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveConfig = () => {
    if (!sourceChannel || !targetChannel || !targetUsername) {
      toast({
        title: "Missing information",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Configuration saved",
        description: "Your channel configuration has been updated",
      });
      setIsLoading(false);
      onToggleConnection();
    }, 1500);
  };

  return (
    <Card className="w-full glass-card animate-slide-up">
      <CardHeader>
        <CardTitle className="text-xl flex items-center justify-between">
          <span>Channel Configuration</span>
          {isConnected && (
            <div className="flex items-center gap-1.5 text-xs font-normal text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 py-0.5 px-2 rounded-full">
              <Check size={14} />
              <span>Connected</span>
            </div>
          )}
        </CardTitle>
        <CardDescription>
          Configure the source and target Telegram channels
        </CardDescription>
      </CardHeader>
      
      <CardContent className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sourceChannel">Source Channel</Label>
              <div className="relative">
                <Input
                  id="sourceChannel"
                  placeholder="e.g., competitor_channel"
                  value={sourceChannel}
                  onChange={(e) => setSourceChannel(e.target.value)}
                  className="pl-9 transition-all focus:border-primary/30"
                />
                <div className="absolute left-3 top-2.5 text-muted-foreground">
                  <Link size={16} />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sourceUsername">Competitor Username</Label>
              <div className="relative">
                <Input
                  id="sourceUsername"
                  placeholder="e.g., @competitor_name"
                  value={sourceUsername}
                  onChange={(e) => setSourceUsername(e.target.value)}
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
              <Label htmlFor="targetChannel">Your Channel</Label>
              <div className="relative">
                <Input
                  id="targetChannel"
                  placeholder="e.g., your_channel"
                  value={targetChannel}
                  onChange={(e) => setTargetChannel(e.target.value)}
                  className="pl-9 transition-all focus:border-primary/30"
                />
                <div className="absolute left-3 top-2.5 text-muted-foreground">
                  <Link size={16} />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="targetUsername">Your Username</Label>
              <div className="relative">
                <Input
                  id="targetUsername"
                  placeholder="e.g., @your_username"
                  value={targetUsername}
                  onChange={(e) => setTargetUsername(e.target.value)}
                  className="pl-9 transition-all focus:border-primary/30"
                />
                <div className="absolute left-3 top-2.5 text-muted-foreground">
                  <span className="text-sm font-medium">@</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between space-x-2">
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
