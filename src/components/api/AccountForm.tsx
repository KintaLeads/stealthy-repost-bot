
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw, Key, Shield, Phone } from "lucide-react";
import { ApiAccount } from '@/types/channels';

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
  const isEditing = !isNew;
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`nickname-${account.id || 'new'}`}>Account Nickname</Label>
        <div className="relative">
          <Input
            id={`nickname-${account.id || 'new'}`}
            placeholder="My Channel Account"
            value={account.nickname}
            onChange={(e) => onChange('nickname', e.target.value)}
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
            onChange={(e) => onChange('apiKey', e.target.value)}
            className="pl-9 transition-all focus:border-primary/30"
          />
          <div className="absolute left-3 top-2.5 text-muted-foreground">
            <Key size={16} />
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor={`apiHash-${account.id || 'new'}`}>API Hash (App api_hash)</Label>
        <div className="relative">
          <Input
            id={`apiHash-${account.id || 'new'}`}
            placeholder="a1b2c3d4e5f6g7h8i9j0..."
            value={account.apiHash}
            onChange={(e) => onChange('apiHash', e.target.value)}
            className="pl-9 transition-all focus:border-primary/30"
            type="password"
          />
          <div className="absolute left-3 top-2.5 text-muted-foreground">
            <Shield size={16} />
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor={`phoneNumber-${account.id || 'new'}`}>Phone Number (with country code)</Label>
        <div className="relative">
          <Input
            id={`phoneNumber-${account.id || 'new'}`}
            placeholder="+1234567890"
            value={account.phoneNumber}
            onChange={(e) => onChange('phoneNumber', e.target.value)}
            className="pl-9 transition-all focus:border-primary/30"
          />
          <div className="absolute left-3 top-2.5 text-muted-foreground">
            <Phone size={16} />
          </div>
        </div>
      </div>
      
      <div className="pt-2">
        <Button 
          onClick={onSave}
          disabled={isSaving}
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
      </div>
    </div>
  );
};

export default AccountForm;
