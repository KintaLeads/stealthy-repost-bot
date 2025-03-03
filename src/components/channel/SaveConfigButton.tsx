
import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface SaveConfigButtonProps {
  isSaving: boolean;
  isConnecting: boolean;
  channelPairs: any[];
  onSave: () => Promise<void>;
}

const SaveConfigButton: React.FC<SaveConfigButtonProps> = ({
  isSaving,
  isConnecting,
  channelPairs,
  onSave
}) => {
  return (
    <Button 
      onClick={onSave} 
      disabled={isSaving || channelPairs.length === 0 || isConnecting}
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
  );
};

export default SaveConfigButton;
