
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { RefreshCw, Bug } from "lucide-react";
import ConnectionToggleButton from '../../channel/ConnectionToggleButton';
import { ApiAccount } from '@/types/dashboard';

interface AccountFormButtonsProps {
  isSaving: boolean;
  isNew: boolean;
  isFormValid: boolean;
  isEditing: boolean;
  isConnected?: boolean;
  isConnecting?: boolean;
  onSave: () => void;
  onCancel?: () => void;
  onToggleConnection?: () => Promise<any>; // Changed to return Promise<any>
  onShowDebugger: () => void;
  showDebugger: boolean;
}

const AccountFormButtons: React.FC<AccountFormButtonsProps> = ({
  isSaving,
  isNew,
  isFormValid,
  isEditing,
  isConnected = false,
  isConnecting = false,
  onSave,
  onCancel,
  onToggleConnection,
  onShowDebugger,
  showDebugger
}) => {
  return (
    <div className="pt-2 space-y-2">
      <Button 
        onClick={onSave}
        disabled={isSaving || !isFormValid}
        className="w-full"
      >
        {isSaving ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            {isEditing ? 'Updating...' : 'Creating...'}
          </>
        ) : (
          isEditing ? 'Update Account' : 'Create Account'
        )}
      </Button>
      
      {isEditing && onToggleConnection && (
        <div className="mt-2">
          <ConnectionToggleButton
            isConnected={isConnected}
            isConnecting={isConnecting}
            isDisabled={!isFormValid || isSaving}
            onToggle={onToggleConnection}
          />
        </div>
      )}
      
      {isNew && onCancel && (
        <Button
          variant="ghost"
          onClick={onCancel}
          className="w-full mt-2"
          disabled={isSaving}
        >
          Cancel
        </Button>
      )}

      <Button
        variant="ghost"
        size="sm" 
        className="w-full mt-2 text-xs" 
        onClick={onShowDebugger}
      >
        <Bug className="h-3 w-3 mr-1" />
        {showDebugger ? 'Hide Debug Info' : 'Show Debug Info'}
      </Button>
    </div>
  );
};

export default AccountFormButtons;
