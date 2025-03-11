
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiAccount } from "@/types/channels";
import { verifyTelegramCode } from "@/services/telegram";
import { toast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info, ExternalLink, RefreshCw, CheckCircle2 } from "lucide-react";
import { handleInitialConnection } from "@/services/telegram/connector";

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
  const [secondsRemaining, setSecondsRemaining] = useState(60);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [sendCodeAttempts, setSendCodeAttempts] = useState(0);
  const [testCode, setTestCode] = useState<string | null>(null);
  
  // Auto-countdown timer for code expiration feedback
  useEffect(() => {
    if (!isOpen) return;
    
    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isOpen]);
  
  // Reset timer when dialog opens and try to send code
  useEffect(() => {
    if (isOpen) {
      setSecondsRemaining(60);
      setCode("");
      setError(null);
      setTestCode(null);
      
      // Don't automatically send code if we've already tried
      if (sendCodeAttempts === 0) {
        console.log("Initial dialog open - sending verification code");
        handleResendCode();
      }
    }
  }, [isOpen, sendCodeAttempts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log(`Submitting verification code for account ${account.id} (${account.nickname || account.phoneNumber})`);
      
      // Pass additional debug option to track the verification process
      const success = await verifyTelegramCode(account, code, {
        debug: true,
        accountId: account.id
      }); 
      
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

  const handleResendCode = async () => {
    try {
      setIsSendingCode(true);
      setSendCodeAttempts(prev => prev + 1);
      setError(null);
      setTestCode(null);
      
      toast({
        title: "Sending new code",
        description: "Requesting a new verification code to be sent to your Telegram app",
      });
      
      // Request a new code by calling the initial connection again
      const result = await handleInitialConnection(account);
      
      if (result.success && result.codeNeeded) {
        // Check if we got a test code (only in development mode)
        if (result._testCode) {
          console.log("Test code received:", result._testCode);
          setTestCode(result._testCode);
          
          toast({
            title: "Test Code Received",
            description: "A test verification code has been provided for development",
          });
        } else {
          toast({
            title: "Code Sent",
            description: "A new verification code has been sent to your Telegram app",
          });
        }
        
        // Reset the timer
        setSecondsRemaining(60);
      } else {
        setError("Failed to send a new code. Please try again later.");
        toast({
          title: "Failed to Send Code",
          description: "Could not send a new verification code. Please try again later.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error resending code:", error);
      setError(error instanceof Error ? error.message : "Failed to send a new code");
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send a new code",
        variant: "destructive",
      });
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleUseTestCode = () => {
    if (testCode) {
      setCode(testCode);
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
            <Alert className="bg-blue-50 text-blue-800 border-blue-200">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Enter the code sent to your phone via Telegram. If you didn't receive a code, you can try again.
                {secondsRemaining > 0 && (
                  <div className="text-xs mt-1">
                    Code expires in {secondsRemaining} seconds
                  </div>
                )}
              </AlertDescription>
            </Alert>
            
            <Alert className="bg-yellow-50 text-yellow-800 border-yellow-200">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium">Where to find your code:</p>
                <ul className="list-disc pl-5 mt-1 text-sm">
                  <li>Check Telegram notifications on your phone</li>
                  <li>Look for a message from "Telegram" in your app</li>
                  <li>The code is typically 5 digits</li>
                  <li>Make sure you're logged into Telegram on your phone</li>
                </ul>
                <a 
                  href="https://telegram.org/dl" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm mt-2 text-yellow-900 hover:underline"
                >
                  Install Telegram app <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </AlertDescription>
            </Alert>
            
            {testCode && (
              <Alert className="bg-green-50 text-green-800 border-green-200">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium">Development Mode</p>
                  <p className="text-sm mt-1">Test code available: {testCode}</p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleUseTestCode}
                    className="mt-2 bg-white"
                  >
                    Use Test Code
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
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
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2 items-center">
            <Button 
              type="button" 
              variant="outline"
              onClick={handleResendCode}
              disabled={isSubmitting || isSendingCode}
              className="w-full sm:w-auto"
            >
              {isSendingCode ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Resend Code
                </>
              )}
            </Button>
            
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
