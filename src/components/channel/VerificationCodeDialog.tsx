
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiAccount } from "@/types/channels";
import { verifyTelegramCode } from "@/services/telegram";

interface VerificationCodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  account: ApiAccount;
  onVerified: () => void;
}

const VerificationCodeDialog: React.FC<VerificationCodeDialogProps> = ({
  isOpen,
  onClose,
  account,
  onVerified
}) => {
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code) return;
    
    setIsSubmitting(true);
    
    try {
      const success = await verifyTelegramCode(account, code);
      
      if (success) {
        onVerified();
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Telegram Verification</DialogTitle>
          <DialogDescription>
            Please enter the verification code sent to {account?.phoneNumber}.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <Input
              id="code"
              placeholder="Verification code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              autoComplete="one-time-code"
              className="text-center text-xl tracking-wider"
            />
          </div>
          
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={isSubmitting || !code}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? "Verifying..." : "Verify Code"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VerificationCodeDialog;
