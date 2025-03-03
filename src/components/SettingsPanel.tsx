
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { RefreshCw, Save, BellRing, FileImage } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface SettingsPanelProps {
  onSettingsChange: (settings: any) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onSettingsChange }) => {
  const { toast } = useToast();
  const [isRealTimeMode, setIsRealTimeMode] = useState<boolean>(true);
  const [backupInterval, setBackupInterval] = useState<string>("30");
  const [isMediaEnabled, setIsMediaEnabled] = useState<boolean>(true);
  const [notificationType, setNotificationType] = useState<string>("important");
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveSettings = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const settings = {
        isRealTimeMode,
        backupInterval: parseInt(backupInterval),
        isMediaEnabled,
        notificationType,
      };
      
      onSettingsChange(settings);
      
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated",
      });
      
      setIsLoading(false);
    }, 1200);
  };

  return (
    <Card className="w-full glass-card animate-slide-up">
      <CardHeader>
        <CardTitle className="text-xl">Advanced Settings</CardTitle>
        <CardDescription>
          Configure monitoring and reposting behavior
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">        
        <div className="flex items-center justify-between space-x-2 pt-2">
          <div className="flex flex-col space-y-1">
            <Label htmlFor="realtimeToggle" className="text-sm font-medium">
              Real-time Monitoring
            </Label>
            <span className="text-[13px] text-muted-foreground">
              Instantly detect and process new messages
            </span>
          </div>
          <Switch
            id="realtimeToggle"
            checked={isRealTimeMode}
            onCheckedChange={setIsRealTimeMode}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="backupInterval" className="text-sm font-medium">
            Backup Check Interval
          </Label>
          <Input
            id="backupInterval"
            type="number"
            min="5"
            max="120"
            value={backupInterval}
            onChange={(e) => setBackupInterval(e.target.value)}
            className="transition-all focus:border-primary/30"
          />
          <p className="text-xs text-muted-foreground">
            Fallback check interval in minutes (only used if real-time monitoring temporarily fails)
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="notificationType" className="text-sm font-medium flex items-center gap-2">
              <BellRing size={16} className="text-muted-foreground" />
              Notification Level
            </Label>
            <Select value={notificationType} onValueChange={setNotificationType}>
              <SelectTrigger>
                <SelectValue placeholder="Select notification level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="important">Important Only</SelectItem>
                <SelectItem value="none">No Notifications</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              When to send notifications about channel activities
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between space-x-2">
              <div className="flex flex-col space-y-1">
                <Label htmlFor="mediaToggle" className="text-sm font-medium flex items-center gap-2">
                  <FileImage size={16} className="text-muted-foreground" />
                  Include Media
                </Label>
                <span className="text-[13px] text-muted-foreground">
                  Repost images, videos, and other files
                </span>
              </div>
              <Switch
                id="mediaToggle"
                checked={isMediaEnabled}
                onCheckedChange={setIsMediaEnabled}
              />
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="justify-end">
        <Button 
          onClick={handleSaveSettings} 
          disabled={isLoading}
          className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SettingsPanel;
