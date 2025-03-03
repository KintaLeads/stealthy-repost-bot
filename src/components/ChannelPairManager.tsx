
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { RefreshCw, Plus, Trash2, Link, Check } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ChannelPair {
  id: string;
  sourceChannel: string;
  targetChannel: string;
  targetUsername: string;
  isActive: boolean;
}

interface ApiAccount {
  id: string;
  nickname: string;
  apiKey: string;
  apiHash: string;
  phoneNumber: string;
}

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
  const [channelPairs, setChannelPairs] = useState<ChannelPair[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoRepost, setIsAutoRepost] = useState(true);
  
  // Load channel pairs when the selected account changes
  useEffect(() => {
    if (selectedAccount) {
      fetchChannelPairs();
    } else {
      setChannelPairs([]);
    }
  }, [selectedAccount]);
  
  const fetchChannelPairs = async () => {
    if (!selectedAccount) return;
    
    try {
      setIsLoading(true);
      
      // In a real implementation, this would fetch from the database
      // For this demo, we'll generate sample data
      const samplePairs = [
        {
          id: '1',
          sourceChannel: 'competitor_channel',
          targetChannel: 'my_channel',
          targetUsername: 'my_username',
          isActive: true
        }
      ];
      
      setChannelPairs(samplePairs);
    } catch (error) {
      console.error('Error fetching channel pairs:', error);
      toast({
        title: "Failed to load channels",
        description: "Could not load your channel configurations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleChannelPairChange = (index: number, field: keyof ChannelPair, value: string | boolean) => {
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
        targetUsername: '',
        isActive: true
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
    if (!selectedAccount) {
      toast({
        title: "No account selected",
        description: "Please select or create an API account first",
        variant: "destructive",
      });
      return;
    }
    
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

    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Configuration saved",
        description: `${channelPairs.length} channel${channelPairs.length > 1 ? 's' : ''} configured successfully`,
      });
      setIsSaving(false);
    }, 1500);
  };
  
  if (!selectedAccount) {
    return (
      <Card className="w-full glass-card animate-slide-up">
        <CardHeader>
          <CardTitle className="text-xl">Channel Configuration</CardTitle>
          <CardDescription>
            Select an API account to configure channels
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            Please select or create an API account first
          </p>
        </CardContent>
      </Card>
    );
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
        {isLoading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
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
                          placeholder="e.g., your_username"
                          value={pair.targetUsername}
                          onChange={(e) => handleChannelPairChange(index, 'targetUsername', e.target.value)}
                          className="pl-9 transition-all focus:border-primary/30"
                        />
                        <div className="absolute left-3 top-2.5 text-muted-foreground">
                          <span className="text-sm font-medium">@</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        This username will be added to messages and replace competitor mentions
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-2 flex items-center justify-between">
                  <Label htmlFor={`active-${index}`} className="cursor-pointer flex items-center gap-2">
                    Active
                  </Label>
                  <Switch
                    id={`active-${index}`}
                    checked={pair.isActive}
                    onCheckedChange={(checked) => handleChannelPairChange(index, 'isActive', checked)}
                  />
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
          </>
        )}
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
          onClick={handleSaveConfig} 
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
