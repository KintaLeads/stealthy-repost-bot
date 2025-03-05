
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiAccount } from "@/types/channels";
import { verifyTelegramCode } from "@/services/telegram";
import { toast } from "@/components/ui/use-toast";

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
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log(`Submitting verification code for account ${account.id} (${account.nickname || account.phoneNumber})`);
      // Pass an empty options object as the third parameter to match the expected signature
      const success = await verifyTelegramCode(account, code, {}); 
      
      if (success) {
        console.log("Verification successful");
        toast({
          title: "Verification Successful",
          description: "Your Telegram account has been verified",
        });
        onVerified();
        onClose();
      } else {
        console.error("Verification failed but no error was thrown");
        setError("Verification failed. Please check your code and try again.");
        toast({
          title: "Verification Failed",
          description: "Please check your code and try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error during verification:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
      toast({
        title: "Verification Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
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
            
            {error && (
              <div className="text-destructive text-sm">{error}</div>
            )}
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
