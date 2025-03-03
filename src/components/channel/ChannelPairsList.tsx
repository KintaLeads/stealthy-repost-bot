
import React from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, RefreshCw } from "lucide-react";
import ChannelPairItem from './ChannelPairItem';
import { ChannelPair } from "@/types/channels";

interface ChannelPairsListProps {
  channelPairs: ChannelPair[];
  isLoading: boolean;
  isAutoRepost: boolean;
  setIsAutoRepost: (value: boolean) => void;
  onChannelPairChange: (index: number, field: keyof ChannelPair, value: string | boolean) => void;
  onChannelPairRemove: (index: number) => void;
  onChannelPairAdd: () => void;
}

const ChannelPairsList: React.FC<ChannelPairsListProps> = ({
  channelPairs,
  isLoading,
  isAutoRepost,
  setIsAutoRepost,
  onChannelPairChange,
  onChannelPairRemove,
  onChannelPairAdd
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <>
      {channelPairs.map((pair, index) => (
        <ChannelPairItem
          key={pair.id}
          pair={pair}
          index={index}
          onPairChange={onChannelPairChange}
          onPairRemove={onChannelPairRemove}
        />
      ))}
      
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onChannelPairAdd}
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
  );
};

export default ChannelPairsList;
