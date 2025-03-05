
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Trash2, Link } from "lucide-react";
import { ChannelPair } from "@/types/channels";

interface ChannelPairItemProps {
  pair: ChannelPair;
  index: number;
  onPairChange: (index: number, field: keyof ChannelPair | 'targetUsername', value: string | boolean) => void;
  onPairRemove: (index: number) => void;
}

const ChannelPairItem: React.FC<ChannelPairItemProps> = ({
  pair,
  index,
  onPairChange,
  onPairRemove
}) => {
  return (
    <div className="space-y-4 border border-border/50 p-4 rounded-lg">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Channel Pair {index + 1}</h3>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => onPairRemove(index)}
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
                onChange={(e) => onPairChange(index, 'sourceChannel', e.target.value)}
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
                onChange={(e) => onPairChange(index, 'targetChannel', e.target.value)}
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
                value={pair.targetUsername || ''}
                onChange={(e) => onPairChange(index, 'targetUsername', e.target.value)}
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
          onCheckedChange={(checked) => onPairChange(index, 'isActive', checked)}
        />
      </div>
    </div>
  );
};

export default ChannelPairItem;
