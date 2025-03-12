
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ApiAccount } from '@/types/channels';

interface ApiCredentialDebuggerProps {
  account: ApiAccount | null;
}

const ApiCredentialDebugger: React.FC<ApiCredentialDebuggerProps> = ({ account }) => {
  if (!account) {
    return null;
  }
  
  // Check if any credential values are problematic
  const hasEmptyValues = !account.apiKey || !account.apiHash || !account.phoneNumber;
  const hasInvalidApiId = isNaN(Number(account.apiKey)) || Number(account.apiKey) <= 0;
  const hasInvalidApiHash = !account.apiHash || account.apiHash.length < 5;
  const hasInvalidPhone = !account.phoneNumber || 
    !/^\+[0-9]{7,15}$/.test(account.phoneNumber.trim());
  
  const hasIssues = hasEmptyValues || hasInvalidApiId || hasInvalidApiHash || hasInvalidPhone;
  
  return (
    <Card className={`mt-4 ${hasIssues ? 'border-red-400' : 'border-green-400'}`}>
      <CardHeader>
        <CardTitle className="text-sm font-medium">API Credential Debug Information</CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="font-semibold">API ID:</div>
          <div className={!account.apiKey ? 'text-red-500' : ''}>
            {account.apiKey || 'MISSING'}
            {account.apiKey && (isNaN(Number(account.apiKey)) || Number(account.apiKey) <= 0) && 
              <span className="text-red-500 ml-2">(Invalid format, must be a positive number)</span>
            }
          </div>
          
          <div className="font-semibold">API Hash:</div>
          <div className={!account.apiHash ? 'text-red-500' : ''}>
            {account.apiHash ? 
              `${account.apiHash.substring(0, 3)}... (length: ${account.apiHash.length})` : 
              'MISSING'
            }
            {account.apiHash && account.apiHash.length < 5 && 
              <span className="text-red-500 ml-2">(Suspiciously short)</span>
            }
          </div>
          
          <div className="font-semibold">Phone Number:</div>
          <div className={!account.phoneNumber ? 'text-red-500' : ''}>
            {account.phoneNumber || 'MISSING'}
            {account.phoneNumber && !/^\+[0-9]{7,15}$/.test(account.phoneNumber.trim()) && 
              <span className="text-red-500 ml-2">(Invalid format, must start with + and contain 7-15 digits)</span>
            }
          </div>
          
          <div className="font-semibold">Account ID:</div>
          <div>{account.id || 'Not available'}</div>
          
          <div className="font-semibold">Values after trim:</div>
          <div>
            API ID: "{account.apiKey?.trim() || ''}" (length: {account.apiKey?.trim().length || 0})<br />
            API Hash: "{account.apiHash ? account.apiHash.trim().substring(0, 3) + '...' : ''}" (length: {account.apiHash?.trim().length || 0})<br />
            Phone: "{account.phoneNumber?.trim() || ''}" (length: {account.phoneNumber?.trim().length || 0})
          </div>
        </div>
        
        {hasIssues ? (
          <div className="bg-red-100 p-2 rounded border border-red-300 mt-2">
            <div className="font-semibold text-red-800">Validation Issues Detected:</div>
            <ul className="list-disc list-inside text-red-700">
              {!account.apiKey && <li>API ID is missing</li>}
              {account.apiKey && (isNaN(Number(account.apiKey)) || Number(account.apiKey) <= 0) && 
                <li>API ID must be a positive number</li>
              }
              {!account.apiHash && <li>API Hash is missing</li>}
              {account.apiHash && account.apiHash.length < 5 && 
                <li>API Hash appears too short</li>
              }
              {!account.phoneNumber && <li>Phone number is missing</li>}
              {account.phoneNumber && !/^\+[0-9]{7,15}$/.test(account.phoneNumber.trim()) && 
                <li>Phone number format is invalid</li>
              }
            </ul>
          </div>
        ) : (
          <div className="bg-green-100 p-2 rounded border border-green-300 mt-2">
            <div className="font-semibold text-green-800">All values appear valid</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ApiCredentialDebugger;
