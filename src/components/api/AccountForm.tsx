
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Key, Shield, Phone, Bug } from "lucide-react";
import { ApiAccount } from '@/types/dashboard';
import ApiCredentialDebugger from '../debug/ApiCredentialDebugger';

interface AccountFormProps {
  account: ApiAccount;
  isNew?: boolean;
  onChange: (field: keyof ApiAccount, value: string) => void;
  onSave: () => void;
  onCancel?: () => void;
  isSaving: boolean;
}

const AccountForm: React.FC<AccountFormProps> = ({
  account,
  isNew = false,
  onChange,
  onSave,
  onCancel,
  isSaving
}) => {
  const [showDebugger, setShowDebugger] = useState(false);
  const isEditing = !isNew;
  
  // Validate API ID format
  const validateApiId = (value: string): string => {
    if (!value.trim()) {
      return "API ID is required";
    }
    
    const apiId = parseInt(value, 10);
    if (isNaN(apiId) || apiId <= 0) {
      return "API ID must be a positive number";
    }
    
    return "";
  };
  
  // Validate API Hash format
  const validateApiHash = (value: string): string => {
    if (!value.trim()) {
      return "API Hash is required";
    }
    
    if (value.length < 5) {
      return "API Hash is too short";
    }
    
    return "";
  };
  
  // Validate phone number format
  const validatePhoneNumber = (value: string): string => {
    if (!value.trim()) {
      return "Phone number is required";
    }
    
    // Basic phone number validation - should start with + and contain numbers
    if (!/^\+[0-9]{7,15}$/.test(value)) {
      return "Invalid phone number format (e.g. +1234567890)";
    }
    
    return "";
  };
  
  // Get error message for a specific field
  const getErrorMessage = (field: keyof ApiAccount): string => {
    switch (field) {
      case 'apiKey':
        return validateApiId(account.apiKey);
      case 'apiHash':
        return validateApiHash(account.apiHash);
      case 'phoneNumber':
        return validatePhoneNumber(account.phoneNumber);
      default:
        return "";
    }
  };
  
  // Handle input change with validation
  const handleInputChange = (field: keyof ApiAccount, value: string) => {
    onChange(field, value);
  };
  
  // Check if form is valid
  const isFormValid = (): boolean => {
    return !validateApiId(account.apiKey) &&
           !validateApiHash(account.apiHash) &&
           !validatePhoneNumber(account.phoneNumber) &&
           !!account.nickname;
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`nickname-${account.id || 'new'}`}>Account Nickname</Label>
        <div className="relative">
          <Input
            id={`nickname-${account.id || 'new'}`}
            placeholder="My Channel Account"
            value={account.nickname}
            onChange={(e) => handleInputChange('nickname', e.target.value)}
            className="transition-all focus:border-primary/30"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          A friendly name to help you identify this API account
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor={`apiKey-${account.id || 'new'}`}>API ID (App api_id)</Label>
        <div className="relative">
          <Input
            id={`apiKey-${account.id || 'new'}`}
            placeholder="12345678"
            value={account.apiKey}
            onChange={(e) => handleInputChange('apiKey', e.target.value)}
            className="pl-9 transition-all focus:border-primary/30"
          />
          <div className="absolute left-3 top-2.5 text-muted-foreground">
            <Key size={16} />
          </div>
        </div>
        {getErrorMessage('apiKey') && (
          <p className="text-xs text-red-500 mt-1">{getErrorMessage('apiKey')}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor={`apiHash-${account.id || 'new'}`}>API Hash (App api_hash)</Label>
        <div className="relative">
          <Input
            id={`apiHash-${account.id || 'new'}`}
            placeholder="a1b2c3d4e5f6g7h8i9j0..."
            value={account.apiHash}
            onChange={(e) => handleInputChange('apiHash', e.target.value)}
            className="pl-9 transition-all focus:border-primary/30"
            type="password"
          />
          <div className="absolute left-3 top-2.5 text-muted-foreground">
            <Shield size={16} />
          </div>
        </div>
        {getErrorMessage('apiHash') && (
          <p className="text-xs text-red-500 mt-1">{getErrorMessage('apiHash')}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor={`phoneNumber-${account.id || 'new'}`}>Phone Number (with country code)</Label>
        <div className="relative">
          <Input
            id={`phoneNumber-${account.id || 'new'}`}
            placeholder="+1234567890"
            value={account.phoneNumber}
            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
            className="pl-9 transition-all focus:border-primary/30"
          />
          <div className="absolute left-3 top-2.5 text-muted-foreground">
            <Phone size={16} />
          </div>
        </div>
        {getErrorMessage('phoneNumber') && (
          <p className="text-xs text-red-500 mt-1">{getErrorMessage('phoneNumber')}</p>
        )}
      </div>

      <div className="pt-2">
        <Button 
          onClick={onSave}
          disabled={isSaving || !isFormValid()}
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
          onClick={() => setShowDebugger(!showDebugger)}
        >
          <Bug className="h-3 w-3 mr-1" />
          {showDebugger ? 'Hide Debug Info' : 'Show Debug Info'}
        </Button>
      </div>

      {showDebugger && <ApiCredentialDebugger account={account} />}
    </div>
  );
};

export default AccountForm;
