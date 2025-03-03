
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { Check, RefreshCw, Link, Unlink, Plus, Trash2, Key, Shield, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ApiCredentials {
  id?: string;
  apiKey: string;
  apiHash: string;
  phoneNumber: string;
}

interface ChannelConfigProps {
  isConnected: boolean;
  onToggleConnection: () => void;
  apiCredentials: ApiCredentials;
  onSaveCredentials: (credentials: ApiCredentials) => void;
  isLoadingCredentials: boolean;
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
  onToggleConnection,
  apiCredentials,
  onSaveCredentials,
  isLoadingCredentials
}) => {
  const [isAutoRepost, setIsAutoRepost] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("channels");
  const [channelPairs, setChannelPairs] = useState<ChannelPair[]>([
    {
      id: '1',
      sourceChannel: '',
      targetChannel: '',
      sourceUsername: '',
      targetUsername: ''
    }
  ]);
  
  const [localCredentials, setLocalCredentials] = useState<ApiCredentials>({
    apiKey: '',
    apiHash: '',
    phoneNumber: ''
  });
  
  // Update local credentials when API credentials change
  useEffect(() => {
    if (!isLoadingCredentials) {
      setLocalCredentials({
        id: apiCredentials.id,
        apiKey: apiCredentials.apiKey,
        apiHash: apiCredentials.apiHash,
        phoneNumber: apiCredentials.phoneNumber
      });
    }
  }, [apiCredentials, isLoadingCredentials]);
  
  const handleCredentialsChange = (field: keyof ApiCredentials, value: string) => {
    setLocalCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSaveApiCredentials = async () => {
    // Validate credentials
    if (!localCredentials.apiKey || !localCredentials.apiHash || !localCredentials.phoneNumber) {
      toast({
        title: "Missing information",
        description: "Please fill all API credential fields",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    await onSaveCredentials(localCredentials);
    setIsLoading(false);
  };
  
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
    // Before saving channel configuration, verify API credentials are set
    if (!localCredentials.apiKey || !localCredentials.apiHash || !localCredentials.phoneNumber) {
      toast({
        title: "API credentials required",
        description: "Please set your Telegram API credentials in the API tab before connecting",
        variant: "destructive",
      });
      setActiveTab("api");
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

  const credentialsExist = Boolean(localCredentials.apiKey && localCredentials.apiHash && localCredentials.phoneNumber);

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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="api">API Credentials</TabsTrigger>
          </TabsList>
          
          <TabsContent value="api" className="space-y-4 mt-4">
            <div className="bg-muted/30 p-4 rounded-lg space-y-1 mb-4">
              <h3 className="text-sm font-medium">Telegram MyProto API</h3>
              <p className="text-xs text-muted-foreground">
                To connect to Telegram, you need to create an application on Telegram's website to get an API ID and hash.
              </p>
              <a
                href="https://my.telegram.org/apps"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1"
              >
                Create API credentials on Telegram's website
                <svg width="12" height="12" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-0.5">
                  <path d="M3 2C2.44772 2 2 2.44772 2 3V12C2 12.5523 2.44772 13 3 13H12C12.5523 13 13 12.5523 13 12V8.5C13 8.22386 12.7761 8 12.5 8C12.2239 8 12 8.22386 12 8.5V12H3V3H6.5C6.77614 3 7 2.77614 7 2.5C7 2.22386 6.77614 2 6.5 2H3ZM12.8536 2.14645C12.9015 2.19439 12.9377 2.24964 12.9621 2.30861C12.9861 2.36669 12.9996 2.4303 13 2.497L13 2.5V2.50049V5.5C13 5.77614 12.7761 6 12.5 6C12.2239 6 12 5.77614 12 5.5V3.70711L6.85355 8.85355C6.65829 9.04882 6.34171 9.04882 6.14645 8.85355C5.95118 8.65829 5.95118 8.34171 6.14645 8.14645L11.2929 3H9.5C9.22386 3 9 2.77614 9 2.5C9 2.22386 9.22386 2 9.5 2H12.4999H12.5C12.5678 2 12.6324 2.01349 12.6914 2.03794C12.7504 2.06234 12.8056 2.09851 12.8536 2.14645Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                </svg>
              </a>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">API ID (App api_id)</Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    placeholder="12345678"
                    value={localCredentials.apiKey}
                    onChange={(e) => handleCredentialsChange('apiKey', e.target.value)}
                    className="pl-9 transition-all focus:border-primary/30"
                  />
                  <div className="absolute left-3 top-2.5 text-muted-foreground">
                    <Key size={16} />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="apiHash">API Hash (App api_hash)</Label>
                <div className="relative">
                  <Input
                    id="apiHash"
                    placeholder="a1b2c3d4e5f6g7h8i9j0..."
                    value={localCredentials.apiHash}
                    onChange={(e) => handleCredentialsChange('apiHash', e.target.value)}
                    className="pl-9 transition-all focus:border-primary/30"
                    type="password"
                  />
                  <div className="absolute left-3 top-2.5 text-muted-foreground">
                    <Shield size={16} />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number (with country code)</Label>
                <div className="relative">
                  <Input
                    id="phoneNumber"
                    placeholder="+1234567890"
                    value={localCredentials.phoneNumber}
                    onChange={(e) => handleCredentialsChange('phoneNumber', e.target.value)}
                    className="pl-9 transition-all focus:border-primary/30"
                  />
                  <div className="absolute left-3 top-2.5 text-muted-foreground">
                    <Phone size={16} />
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleSaveApiCredentials} 
                disabled={isLoading}
                className="w-full mt-2"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save API Credentials'
                )}
              </Button>
              
              {credentialsExist && (
                <div className="flex items-center justify-center text-sm text-emerald-600 dark:text-emerald-400 gap-1.5 mt-2">
                  <Check size={16} />
                  <span>API credentials saved</span>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="channels" className="space-y-4 mt-4">
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
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={onToggleConnection}
          className="border-border hover:bg-secondary/80 transition-colors"
          disabled={!credentialsExist}
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
          disabled={isLoading || !credentialsExist}
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
