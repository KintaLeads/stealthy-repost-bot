
import React from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw, Link } from "lucide-react";

interface ConnectionToggleButtonProps {
  isConnected: boolean;
  isConnecting: boolean;
  isDisabled: boolean;
  onToggle: () => void;
}

const ConnectionToggleButton: React.FC<ConnectionToggleButtonProps> = ({
  isConnected,
  isConnecting,
  isDisabled,
  onToggle
}) => {
  return (
    <Button
      variant={isConnected ? "destructive" : "default"}
      onClick={onToggle}
      className={isConnected ? "" : "bg-primary text-primary-foreground hover:bg-primary/90"}
      disabled={isDisabled}
    >
      {isConnecting ? (
        <>
          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          Connecting...
        </>
      ) : isConnected ? (
        <>
          <Link className="mr-2 h-4 w-4" />
          Disconnect
        </>
      ) : (
        <>
          <Link className="mr-2 h-4 w-4" />
          Connect to Telegram
        </>
      )}
    </Button>
  );
};

export default ConnectionToggleButton;
