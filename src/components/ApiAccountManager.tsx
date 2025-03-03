
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Check, RefreshCw, Plus, Trash2, Key, Shield, Phone, Edit } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

interface ApiAccount {
  id: string;
  nickname: string;
  apiKey: string;
  apiHash: string;
  phoneNumber: string;
  isActive?: boolean;
}

interface ApiAccountManagerProps {
  onAccountSelect: (account: ApiAccount) => void;
  selectedAccountId: string | null;
}

const ApiAccountManager: React.FC<ApiAccountManagerProps> = ({ onAccountSelect, selectedAccountId }) => {
  const [accounts, setAccounts] = useState<ApiAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [newAccount, setNewAccount] = useState<ApiAccount>({
    id: '',
    nickname: '',
    apiKey: '',
    apiHash: '',
    phoneNumber: ''
  });
  
  // Fetch API accounts on component mount
  useEffect(() => {
    fetchApiAccounts();
  }, []);
  
  const fetchApiAccounts = async () => {
    try {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast({
          title: "Authentication required",
          description: "Please log in to manage API accounts",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('api_credentials')
        .select('*')
        .eq('api_name', 'myproto_telegram')
        .eq('user_id', session.user.id)
        .order('nickname', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        const formattedAccounts = data.map(account => ({
          id: account.id,
          nickname: account.nickname || 'Default Account',
          apiKey: account.api_key || '',
          apiHash: account.api_secret?.split('|')[0] || '',
          phoneNumber: account.api_secret?.split('|')[1] || '',
          isActive: selectedAccountId === account.id
        }));
        
        setAccounts(formattedAccounts);
        
        // If there's no selected account yet but we have accounts, select the first one
        if (!selectedAccountId && formattedAccounts.length > 0) {
          onAccountSelect(formattedAccounts[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching API accounts:', error);
      toast({
        title: "Failed to load accounts",
        description: error.message || "Could not load your API accounts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCreateAccount = async () => {
    try {
      if (!newAccount.nickname || !newAccount.apiKey || !newAccount.apiHash || !newAccount.phoneNumber) {
        toast({
          title: "Missing information",
          description: "Please fill all required fields",
          variant: "destructive",
        });
        return;
      }
      
      setIsSaving(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast({
          title: "Authentication required",
          description: "Please log in to create API accounts",
          variant: "destructive",
        });
        return;
      }
      
      // Prepare API secret (combines apiHash and phoneNumber)
      const apiSecret = `${newAccount.apiHash}|${newAccount.phoneNumber}`;
      
      const { data, error } = await supabase
        .from('api_credentials')
        .insert({
          user_id: session.user.id,
          api_name: 'myproto_telegram',
          api_key: newAccount.apiKey,
          api_secret: apiSecret,
          nickname: newAccount.nickname
        })
        .select()
        .single();
      
      if (error) throw error;
      
      if (data) {
        const createdAccount = {
          id: data.id,
          nickname: data.nickname,
          apiKey: data.api_key,
          apiHash: newAccount.apiHash,
          phoneNumber: newAccount.phoneNumber,
          isActive: true
        };
        
        setAccounts(prev => [...prev, createdAccount]);
        
        // Reset form
        setNewAccount({
          id: '',
          nickname: '',
          apiKey: '',
          apiHash: '',
          phoneNumber: ''
        });
        
        // Select the newly created account
        onAccountSelect(createdAccount);
        
        toast({
          title: "Account created",
          description: `API account "${data.nickname}" has been created successfully`,
        });
        
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Error creating API account:', error);
      toast({
        title: "Failed to create account",
        description: error.message || "Could not create your API account",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleUpdateAccount = async (account: ApiAccount) => {
    try {
      if (!account.nickname || !account.apiKey || !account.apiHash || !account.phoneNumber) {
        toast({
          title: "Missing information",
          description: "Please fill all required fields",
          variant: "destructive",
        });
        return;
      }
      
      setIsSaving(true);
      
      // Prepare API secret (combines apiHash and phoneNumber)
      const apiSecret = `${account.apiHash}|${account.phoneNumber}`;
      
      const { error } = await supabase
        .from('api_credentials')
        .update({
          api_key: account.apiKey,
          api_secret: apiSecret,
          nickname: account.nickname,
          updated_at: new Date().toISOString()
        })
        .eq('id', account.id);
      
      if (error) throw error;
      
      // Update local state
      setAccounts(prev => 
        prev.map(acc => acc.id === account.id ? { ...account, isActive: true } : acc)
      );
      
      // Select the updated account
      onAccountSelect(account);
      
      toast({
        title: "Account updated",
        description: `API account "${account.nickname}" has been updated successfully`,
      });
    } catch (error) {
      console.error('Error updating API account:', error);
      toast({
        title: "Failed to update account",
        description: error.message || "Could not update your API account",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDeleteAccount = async (accountId: string) => {
    try {
      // Find the account to be deleted
      const accountToDelete = accounts.find(acc => acc.id === accountId);
      
      if (!accountToDelete) return;
      
      // Ask for confirmation
      if (!window.confirm(`Are you sure you want to delete the API account "${accountToDelete.nickname}"? This action cannot be undone.`)) {
        return;
      }
      
      setIsLoading(true);
      
      const { error } = await supabase
        .from('api_credentials')
        .delete()
        .eq('id', accountId);
      
      if (error) throw error;
      
      // Update local state
      const updatedAccounts = accounts.filter(acc => acc.id !== accountId);
      setAccounts(updatedAccounts);
      
      // If we deleted the selected account, select another one if available
      if (selectedAccountId === accountId && updatedAccounts.length > 0) {
        onAccountSelect(updatedAccounts[0]);
      } else if (updatedAccounts.length === 0) {
        onAccountSelect(null);
      }
      
      toast({
        title: "Account deleted",
        description: `API account "${accountToDelete.nickname}" has been deleted successfully`,
      });
    } catch (error) {
      console.error('Error deleting API account:', error);
      toast({
        title: "Failed to delete account",
        description: error.message || "Could not delete your API account",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSelectAccount = (accountId: string) => {
    const account = accounts.find(acc => acc.id === accountId);
    if (account) {
      // Update active status for all accounts
      setAccounts(prev => 
        prev.map(acc => ({
          ...acc,
          isActive: acc.id === accountId
        }))
      );
      
      onAccountSelect(account);
    }
  };
  
  // Create the account form
  const renderAccountForm = (account: ApiAccount, isNew = false) => {
    const isEditing = !isNew;
    
    const handleInputChange = (field: keyof ApiAccount, value: string) => {
      if (isNew) {
        setNewAccount(prev => ({
          ...prev,
          [field]: value
        }));
      } else {
        setAccounts(prev => 
          prev.map(acc => acc.id === account.id 
            ? { ...acc, [field]: value } 
            : acc
          )
        );
      }
    };
    
    const handleSave = () => {
      if (isNew) {
        handleCreateAccount();
      } else {
        handleUpdateAccount(account);
      }
    };
    
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`nickname-${account.id || 'new'}`}>Account Nickname</Label>
          <div className="relative">
            <Input
              id={`nickname-${account.id || 'new'}`}
              placeholder="My Channel Account"
              value={isNew ? newAccount.nickname : account.nickname}
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
              value={isNew ? newAccount.apiKey : account.apiKey}
              onChange={(e) => handleInputChange('apiKey', e.target.value)}
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
              value={isNew ? newAccount.apiHash : account.apiHash}
              onChange={(e) => handleInputChange('apiHash', e.target.value)}
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
              value={isNew ? newAccount.phoneNumber : account.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              className="pl-9 transition-all focus:border-primary/30"
            />
            <div className="absolute left-3 top-2.5 text-muted-foreground">
              <Phone size={16} />
            </div>
          </div>
        </div>
        
        <div className="pt-2">
          <Button 
            onClick={handleSave}
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
          
          {isNew && (
            <Button
              variant="ghost"
              onClick={() => setIsCreating(false)}
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
              <div className="space-y-2">
                <Label>Select API Account</Label>
                <div className="flex flex-wrap gap-2">
                  {accounts.map(account => (
                    <Badge
                      key={account.id}
                      variant={account.isActive ? "default" : "outline"}
                      className={`cursor-pointer ${account.isActive ? "bg-primary text-primary-foreground" : "hover:bg-secondary/80"} px-3 py-1.5 text-sm transition-colors`}
                      onClick={() => handleSelectAccount(account.id)}
                    >
                      {account.nickname}
                      {account.isActive && <Check className="ml-1 h-3.5 w-3.5" />}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {/* Account details */}
            {isCreating ? (
              <div className="border border-border/50 rounded-lg p-4">
                <h3 className="text-md font-medium mb-4">Create New API Account</h3>
                {renderAccountForm(newAccount, true)}
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
                
                {renderAccountForm(accounts.find(acc => acc.id === selectedAccountId))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ApiAccountManager;
