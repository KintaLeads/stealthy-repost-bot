
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { RefreshCw, Save, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface SettingsPanelProps {
  onSettingsChange: (settings: any) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onSettingsChange }) => {
  const { toast } = useToast();
  const [interval, setInterval] = useState<number>(5);
  const [isMediaEnabled, setIsMediaEnabled] = useState<boolean>(true);
  const [maxRetries, setMaxRetries] = useState<string>("3");
  const [notificationType, setNotificationType] = useState<string>("important");
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveSettings = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const settings = {
        interval,
        isMediaEnabled,
        maxRetries: parseInt(maxRetries),
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
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="interval" className="text-sm font-medium">
              Check Interval <span className="text-muted-foreground">({interval} min)</span>
            </Label>
            <Clock size={16} className="text-muted-foreground" />
          </div>
          <Slider
            id="interval"
            defaultValue={[interval]}
            max={60}
            min={1}
            step={1}
            onValueChange={(values) => setInterval(values[0])}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-1">
            How often to check for new messages (1-60 minutes)
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="maxRetries" className="text-sm font-medium">
              Max Retries
            </Label>
            <Input
              id="maxRetries"
              type="number"
              min="1"
              max="10"
              value={maxRetries}
              onChange={(e) => setMaxRetries(e.target.value)}
              className="transition-all focus:border-primary/30"
            />
            <p className="text-xs text-muted-foreground">
              Maximum attempts for failed operations
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notificationType" className="text-sm font-medium">
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
              When to send notifications
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between space-x-2 pt-2">
          <div className="flex flex-col space-y-1">
            <Label htmlFor="mediaToggle" className="text-sm font-medium">
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
