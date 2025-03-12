
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { RefreshCw, Plus, Trash2 } from "lucide-react";
import { ApiAccount } from '@/types/dashboard';
import { useApiAccounts } from '@/hooks/useApiAccounts';
import AccountForm from './api/AccountForm';
import AccountSwitcher from './api/AccountSwitcher';

interface ApiAccountManagerProps {
  onAccountSelect: (account: ApiAccount) => void;
  selectedAccountId: string | null;
  isConnected?: boolean;
  isConnecting?: boolean;
  onToggleConnection?: () => void;
}

const ApiAccountManager: React.FC<ApiAccountManagerProps> = ({ 
  onAccountSelect, 
  selectedAccountId,
  isConnected = false,
  isConnecting = false,
  onToggleConnection
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newAccount, setNewAccount] = useState<ApiAccount>({
    id: '',
    nickname: '',
    apiKey: '',
    apiHash: '',
    phoneNumber: ''
  });
  
  const {
    accounts,
    isLoading,
    isSaving,
    handleCreateAccount,
    handleUpdateAccount,
    handleDeleteAccount,
    handleSelectAccount
  } = useApiAccounts(selectedAccountId, onAccountSelect);
  
  const handleNewAccountInputChange = (field: keyof ApiAccount, value: string) => {
    setNewAccount(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleExistingAccountInputChange = (account: ApiAccount, field: keyof ApiAccount, value: string) => {
    const updatedAccounts = accounts.map(acc => 
      acc.id === account.id ? { ...acc, [field]: value } : acc
    );
    
    // Update the selected account in the parent component
    if (account.id === selectedAccountId) {
      onAccountSelect({ ...account, [field]: value });
    }
  };
  
  const handleCreateAccountSubmit = async () => {
    const success = await handleCreateAccount(newAccount);
    if (success) {
      setNewAccount({
        id: '',
        nickname: '',
        apiKey: '',
        apiHash: '',
        phoneNumber: ''
      });
      setIsCreating(false);
    }
  };
  
  return (
    <Card className="w-full glass-card animate-slide-up">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">API Accounts</CardTitle>
            <CardDescription>
              Manage your Telegram API accounts
            </CardDescription>
          </div>
          {accounts.length > 0 && !isCreating && (
            <Button
              onClick={() => setIsCreating(true)}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Plus size={16} />
              <span>Add Account</span>
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : accounts.length === 0 && !isCreating ? (
          <div className="text-center py-8">
            <h3 className="text-lg font-medium mb-2">No API accounts yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first Telegram API account to get started
            </p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus size={16} className="mr-1" />
              Add First Account
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Account switcher */}
            {accounts.length > 0 && !isCreating && (
              <AccountSwitcher 
                accounts={accounts} 
                onSelect={handleSelectAccount} 
              />
            )}
            
            {/* Account details */}
            {isCreating ? (
              <div className="border border-border/50 rounded-lg p-4">
                <h3 className="text-md font-medium mb-4">Create New API Account</h3>
                <AccountForm
                  account={newAccount}
                  isNew={true}
                  onChange={handleNewAccountInputChange}
                  onSave={handleCreateAccountSubmit}
                  onCancel={() => setIsCreating(false)}
                  isSaving={isSaving}
                />
              </div>
            ) : selectedAccountId && (
              <div className="border border-border/50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-md font-medium">Account Details</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteAccount(selectedAccountId)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delete this API account</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                {accounts.find(acc => acc.id === selectedAccountId) && (
                  <AccountForm
                    account={accounts.find(acc => acc.id === selectedAccountId)}
                    onChange={(field, value) => {
                      const account = accounts.find(acc => acc.id === selectedAccountId);
                      if (account) {
                        handleExistingAccountInputChange(account, field, value);
                      }
                    }}
                    onSave={() => {
                      const account = accounts.find(acc => acc.id === selectedAccountId);
                      if (account) {
                        handleUpdateAccount(account);
                      }
                    }}
                    isSaving={isSaving}
                    isConnected={isConnected}
                    isConnecting={isConnecting}
                    onToggleConnection={onToggleConnection}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ApiAccountManager;
