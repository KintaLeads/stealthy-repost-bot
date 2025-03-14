import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, ArrowRight, Lock } from "lucide-react";
import { verifyTelegramCode } from "@/services/telegram/verifier";
import { ApiAccount } from "@/types/channels";
import { ConnectionResult } from "@/services/telegram/types";

interface VerificationCodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  account: ApiAccount | null;
  connectionResult?: ConnectionResult;
  onVerificationSuccess: () => void;
}

const VerificationCodeDialog: React.FC<VerificationCodeDialogProps> = ({
  isOpen,
  onClose,
  account,
  connectionResult,
  onVerificationSuccess
}) => {
  const [code, setCode] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [codeHelper, setCodeHelper] = useState<string | null>(null);
  
  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCode("");
      setError(null);
      setIsVerifying(false);
      setCodeHelper("Enter the verification code sent to your Telegram app");
      
      // ✅ Store phone code hash in localStorage if provided
      if (account && connectionResult?.phoneCodeHash) {
        localStorage.setItem(`telegram_code_hash_${account.id}`, connectionResult.phoneCodeHash);
      }
      
      // Show test code if available in development mode
      if (connectionResult?._testCode) {
        setCodeHelper(`Test code: ${connectionResult._testCode} (only visible in development mode)`);
      }
    }
  }, [isOpen, connectionResult, account]);
  
  const handleVerify = async () => {
    if (!code.trim()) {
      setError("Please enter the verification code");
      return;
    }
    
    if (!account) {
      setError("Account information is missing. Please try reconnecting.");
      return;
    }
    
    try {
      setIsVerifying(true);
      setError(null);
      
      // ✅ Call verify function with properly formatted data
      const success = await verifyTelegramCode(account, code.trim(), {
        phoneCodeHash: connectionResult?.phoneCodeHash,
        debug: true
      });
      
      if (success) {
        onVerificationSuccess();
        onClose();
      } else {
        setError("Invalid verification code. Please try again.");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setError(error instanceof Error ? error.message : "An error occurred during verification");
    } finally {
      setIsVerifying(false);
    }
  };
  
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value);
    if (error) setError(null);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isVerifying) {
      handleVerify();
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Verify Your Telegram Account
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-4">
              Telegram has sent a verification code to your Telegram account. 
              Please enter the code below to complete the authentication.
            </p>
            
            {codeHelper && (
              <p className="text-sm text-blue-500 dark:text-blue-400 mb-4">
                {codeHelper}
              </p>
            )}
            
            <Input
              placeholder="Enter verification code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isVerifying) {
                  handleVerify();
                }
              }}
              autoFocus
              maxLength={6}
              className="mb-4"
              disabled={isVerifying}
            />
            
            {error && (
              <Alert variant="destructive" className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isVerifying}>
            Cancel
          </Button>
          <Button onClick={handleVerify} disabled={isVerifying || !code.trim()}>
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                Verify
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VerificationCodeDialog;
