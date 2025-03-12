
import React, { useState } from 'react';
import { Key, Shield, Phone } from "lucide-react";
import { ApiAccount } from '@/types/dashboard';
import ApiCredentialDebugger from '../debug/ApiCredentialDebugger';
import FormField from './form/FormField';
import AccountFormButtons from './form/AccountFormButtons';
import { getErrorMessage, isFormValid } from './validation/ValidationUtils';

interface AccountFormProps {
  account: ApiAccount;
  isNew?: boolean;
  onChange: (field: keyof ApiAccount, value: string) => void;
  onSave: () => void;
  onCancel?: () => void;
  isSaving: boolean;
  isConnected?: boolean;
  isConnecting?: boolean;
  onToggleConnection?: () => void;
}

const AccountForm: React.FC<AccountFormProps> = ({
  account,
  isNew = false,
  onChange,
  onSave,
  onCancel,
  isSaving,
  isConnected = false,
  isConnecting = false,
  onToggleConnection
}) => {
  const [showDebugger, setShowDebugger] = useState(false);
  const isEditing = !isNew;
  
  // Handle input change with validation
  const handleInputChange = (field: keyof ApiAccount, value: string) => {
    onChange(field, value);
  };
  
  return (
    <div className="space-y-4">
      <FormField
        id={`nickname-${account.id || 'new'}`}
        label="Account Nickname"
        placeholder="My Channel Account"
        value={account.nickname}
        onChange={(value) => handleInputChange('nickname', value)}
        description="A friendly name to help you identify this API account"
      />
      
      <FormField
        id={`apiKey-${account.id || 'new'}`}
        label="API ID (App api_id)"
        placeholder="12345678"
        value={account.apiKey}
        onChange={(value) => handleInputChange('apiKey', value)}
        icon={<Key size={16} />}
        error={getErrorMessage('apiKey', account.apiKey)}
      />
      
      <FormField
        id={`apiHash-${account.id || 'new'}`}
        label="API Hash (App api_hash)"
        placeholder="a1b2c3d4e5f6g7h8i9j0..."
        value={account.apiHash}
        onChange={(value) => handleInputChange('apiHash', value)}
        icon={<Shield size={16} />}
        error={getErrorMessage('apiHash', account.apiHash)}
        type="password"
      />
      
      <FormField
        id={`phoneNumber-${account.id || 'new'}`}
        label="Phone Number (with country code)"
        placeholder="+1234567890"
        value={account.phoneNumber}
        onChange={(value) => handleInputChange('phoneNumber', value)}
        icon={<Phone size={16} />}
        error={getErrorMessage('phoneNumber', account.phoneNumber)}
      />

      <AccountFormButtons
        isSaving={isSaving}
        isNew={isNew}
        isFormValid={isFormValid(account)}
        isEditing={isEditing}
        isConnected={isConnected}
        isConnecting={isConnecting}
        onSave={onSave}
        onCancel={onCancel}
        onToggleConnection={onToggleConnection}
        onShowDebugger={() => setShowDebugger(!showDebugger)}
        showDebugger={showDebugger}
      />

      {showDebugger && <ApiCredentialDebugger account={account} />}
    </div>
  );
};

export default AccountForm;
