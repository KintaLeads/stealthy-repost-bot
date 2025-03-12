
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ApiAccount as DashboardApiAccount } from '@/types/dashboard';

interface ApiCredentialDebuggerProps {
  account: DashboardApiAccount | null;
}

const ApiCredentialDebugger: React.FC<ApiCredentialDebuggerProps> = ({ account }) => {
  if (!account) {
    return null;
  }
  
  // Enhanced validation to catch even more edge cases
  const hasEmptyValues = !account.apiKey || !account.apiHash || !account.phoneNumber;
  
  // API ID validation - must be a positive number
  const apiIdTrimmed = account.apiKey ? account.apiKey.trim() : '';
  const apiIdNum = Number(apiIdTrimmed);
  const hasInvalidApiId = isNaN(apiIdNum) || apiIdNum <= 0 || apiIdTrimmed === '';
  
  // API Hash validation - should be at least a certain length and not have just whitespace
  const apiHashTrimmed = account.apiHash ? account.apiHash.trim() : '';
  const hasInvalidApiHash = !apiHashTrimmed || apiHashTrimmed.length < 5;
  
  // Phone number validation - should match international format
  const phoneNumberTrimmed = account.phoneNumber ? account.phoneNumber.trim() : '';
  const hasInvalidPhone = !phoneNumberTrimmed || 
    !/^\+[0-9]{7,15}$/.test(phoneNumberTrimmed);
  
  const hasIssues = hasEmptyValues || hasInvalidApiId || hasInvalidApiHash || hasInvalidPhone;
  
  // String conversion safety checks
  const apiIdStr = String(account.apiKey || '');
  const apiHashStr = String(account.apiHash || '');
  const phoneStr = String(account.phoneNumber || '');
  
  return (
    <Card className={`mt-4 ${hasIssues ? 'border-red-400' : 'border-green-400'}`}>
      <CardHeader>
        <CardTitle className="text-sm font-medium">API Credential Debug Information</CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="font-semibold">API ID:</div>
          <div className={!apiIdTrimmed ? 'text-red-500' : ''}>
            {apiIdTrimmed || 'MISSING'}
            {apiIdTrimmed && (isNaN(apiIdNum) || apiIdNum <= 0) && 
              <span className="text-red-500 ml-2">(Invalid format, must be a positive number)</span>
            }
          </div>
          
          <div className="font-semibold">API Hash:</div>
          <div className={!apiHashTrimmed ? 'text-red-500' : ''}>
            {apiHashTrimmed ? 
              `${apiHashTrimmed.substring(0, 3)}... (length: ${apiHashTrimmed.length})` : 
              'MISSING'
            }
            {apiHashTrimmed && apiHashTrimmed.length < 5 && 
              <span className="text-red-500 ml-2">(Suspiciously short)</span>
            }
          </div>
          
          <div className="font-semibold">Phone Number:</div>
          <div className={!phoneNumberTrimmed ? 'text-red-500' : ''}>
            {phoneNumberTrimmed || 'MISSING'}
            {phoneNumberTrimmed && !/^\+[0-9]{7,15}$/.test(phoneNumberTrimmed) && 
              <span className="text-red-500 ml-2">(Invalid format, must start with + and contain 7-15 digits)</span>
            }
          </div>
          
          <div className="font-semibold">Account ID:</div>
          <div>{account.id || 'Not available'}</div>
          
          <div className="font-semibold">Value types:</div>
          <div>
            API ID: {typeof account.apiKey} (toString: "{apiIdStr}")<br />
            API Hash: {typeof account.apiHash} (toString: "{apiHashStr ? apiHashStr.substring(0, 3) + '...' : ''}")<br />
            Phone: {typeof account.phoneNumber} (toString: "{phoneStr}")
          </div>
          
          <div className="font-semibold">Values after trim:</div>
          <div>
            API ID: "{apiIdTrimmed}" (length: {apiIdTrimmed.length})<br />
            API Hash: "{apiHashTrimmed ? apiHashTrimmed.substring(0, 3) + '...' : ''}" (length: {apiHashTrimmed.length})<br />
            Phone: "{phoneNumberTrimmed}" (length: {phoneNumberTrimmed.length})
          </div>
          
          <div className="font-semibold">Edge case checks:</div>
          <div>
            API ID is 'undefined'/'null' string: {account.apiKey === 'undefined' || account.apiKey === 'null' ? 'Yes ⚠️' : 'No'}<br />
            API Hash is 'undefined'/'null' string: {account.apiHash === 'undefined' || account.apiHash === 'null' ? 'Yes ⚠️' : 'No'}<br />
            Phone is 'undefined'/'null' string: {account.phoneNumber === 'undefined' || account.phoneNumber === 'null' ? 'Yes ⚠️' : 'No'}
          </div>
        </div>
        
        {hasIssues ? (
          <div className="bg-red-100 p-2 rounded border border-red-300 mt-2">
            <div className="font-semibold text-red-800">Validation Issues Detected:</div>
            <ul className="list-disc list-inside text-red-700">
              {!apiIdTrimmed && <li>API ID is missing</li>}
              {apiIdTrimmed && (isNaN(apiIdNum) || apiIdNum <= 0) && 
                <li>API ID must be a positive number</li>
              }
              {!apiHashTrimmed && <li>API Hash is missing</li>}
              {apiHashTrimmed && apiHashTrimmed.length < 5 && 
                <li>API Hash appears too short</li>
              }
              {!phoneNumberTrimmed && <li>Phone number is missing</li>}
              {phoneNumberTrimmed && !/^\+[0-9]{7,15}$/.test(phoneNumberTrimmed) && 
                <li>Phone number format is invalid</li>
              }
              {(account.apiKey === 'undefined' || account.apiKey === 'null') && 
                <li>API ID has string 'undefined' or 'null'</li>
              }
              {(account.apiHash === 'undefined' || account.apiHash === 'null') && 
                <li>API Hash has string 'undefined' or 'null'</li>
              }
              {(account.phoneNumber === 'undefined' || account.phoneNumber === 'null') && 
                <li>Phone number has string 'undefined' or 'null'</li>
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
