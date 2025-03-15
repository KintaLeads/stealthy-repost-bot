
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { verifyTelegramCode } from '@/services/telegram/verifier';
import { useApiAccounts } from '@/hooks/useApiAccounts';
import { toast } from 'sonner';
import { ChannelsApiAccount } from '@/types/channels';

interface VerificationCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  phoneCodeHash: string | null;
  accountId: string;
  onComplete: (success: boolean) => void;
}

const VerificationCodeModal: React.FC<VerificationCodeModalProps> = ({
  isOpen,
  onClose,
  phoneCodeHash,
  accountId,
  onComplete
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get the account from the hooks
  const { accounts } = useApiAccounts(accountId, () => {});
  const dashboardAccount = accounts.find(acc => acc.id === accountId);
  
  const handleVerify = async () => {
    if (!dashboardAccount) {
      setError('Account not found. Please try again.');
      return;
    }
    
    if (!verificationCode.trim()) {
      setError('Please enter the verification code.');
      return;
    }
    
    setIsVerifying(true);
    setError(null);
    
    try {
      console.log('Verifying code:', {
        accountId,
        phoneCodeHash,
        code: verificationCode
      });
      
      // Create a channels-compatible account object
      const channelsAccount: ChannelsApiAccount = {
        ...dashboardAccount,
        createdAt: new Date().toISOString(),
        userId: 'current-user'
      };
      
      // Call the verification service
      const success = await verifyTelegramCode(channelsAccount, verificationCode, {
        phoneCodeHash: phoneCodeHash || undefined
      });
      
      if (success) {
        toast.success('Verification successful!');
        onComplete(true);
      } else {
        setError('Verification failed. Please check the code and try again.');
        onComplete(false);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      onComplete(false);
    } finally {
      setIsVerifying(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Verify your Telegram account</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <p className="text-sm text-muted-foreground">
            A verification code has been sent to your Telegram app. 
            Please enter the code below to complete the connection.
          </p>
          
          <div className="grid gap-2">
            <Label htmlFor="verification-code">Verification Code</Label>
            <Input
              id="verification-code"
              placeholder="12345"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              disabled={isVerifying}
              autoFocus
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={onClose} variant="outline" disabled={isVerifying}>
            Cancel
          </Button>
          <Button onClick={handleVerify} disabled={isVerifying}>
            {isVerifying ? 'Verifying...' : 'Verify Code'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VerificationCodeModal;
