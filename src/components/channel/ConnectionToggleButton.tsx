
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PowerIcon } from "lucide-react";
import { toast } from 'sonner';
import VerificationCodeModal from '../verification/VerificationCodeModal';

interface ConnectionToggleButtonProps {
  isConnected: boolean;
  isConnecting: boolean;
  isDisabled?: boolean;
  onToggle: () => Promise<any>;
}

const ConnectionToggleButton: React.FC<ConnectionToggleButtonProps> = ({
  isConnected,
  isConnecting,
  isDisabled = false,
  onToggle
}) => {
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [phoneCodeHash, setPhoneCodeHash] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  
  const handleToggleConnection = async () => {
    try {
      // This should return the result from setupRealtimeListener or connectToTelegram
      const result = await onToggle();
      
      console.log('Connection toggle result:', result);
      
      // Check if verification is needed
      if (result && result.needsVerification) {
        console.log('Verification needed, showing modal');
        setPhoneCodeHash(result.phoneCodeHash || null);
        setShowVerificationModal(true);
        
        // Extract accountId from local storage based on pattern
        const keys = Object.keys(localStorage);
        const codeHashKey = keys.find(key => key.startsWith('telegram_code_hash_'));
        if (codeHashKey) {
          setAccountId(codeHashKey.replace('telegram_code_hash_', ''));
        }
      }
    } catch (error) {
      console.error('Error toggling connection:', error);
      toast.error(`Connection error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  const handleVerificationComplete = (success: boolean) => {
    setShowVerificationModal(false);
    
    if (success) {
      toast.success('Successfully verified! Connection established.');
      // We need to retry the connection now that we're verified
      onToggle().catch(error => {
        console.error('Error after verification:', error);
        toast.error(`Connection error: ${error instanceof Error ? error.message : String(error)}`);
      });
    } else {
      toast.error('Verification failed. Please try connecting again.');
    }
  };
  
  return (
    <>
      <Button
        variant={isConnected ? "destructive" : "default"}
        onClick={handleToggleConnection}
        disabled={isConnecting || isDisabled}
        className="w-full"
      >
        <PowerIcon className={`mr-2 h-4 w-4 ${isConnecting ? 'animate-spin' : ''}`} />
        {isConnecting 
          ? 'Connecting...' 
          : isConnected 
            ? 'Disconnect' 
            : 'Connect to Telegram'
        }
      </Button>
      
      {/* Verification Code Modal */}
      {showVerificationModal && accountId && (
        <VerificationCodeModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          phoneCodeHash={phoneCodeHash}
          accountId={accountId}
          onComplete={handleVerificationComplete}
        />
      )}
    </>
  );
};

export default ConnectionToggleButton;
