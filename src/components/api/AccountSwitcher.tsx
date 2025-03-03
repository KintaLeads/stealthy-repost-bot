
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";
import { ApiAccount } from '@/types/channels';

interface AccountSwitcherProps {
  accounts: ApiAccount[];
  onSelect: (accountId: string) => void;
}

const AccountSwitcher: React.FC<AccountSwitcherProps> = ({ accounts, onSelect }) => {
  if (accounts.length === 0) return null;
  
  return (
    <div className="space-y-2">
      <Label>Select API Account</Label>
      <div className="flex flex-wrap gap-2">
        {accounts.map(account => (
          <Badge
            key={account.id}
            variant={account.isActive ? "default" : "outline"}
            className={`cursor-pointer ${account.isActive ? "bg-primary text-primary-foreground" : "hover:bg-secondary/80"} px-3 py-1.5 text-sm transition-colors`}
            onClick={() => onSelect(account.id)}
          >
            {account.nickname}
            {account.isActive && <Check className="ml-1 h-3.5 w-3.5" />}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default AccountSwitcher;
