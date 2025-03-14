// ... keep existing code (imports and other utility functions)

class ConsoleDebugger {
  private logs: LogEntry[] = [];
  private apiPayloads: ApiPayloadEntry[] = [];
  private maxLogs = 500;

  constructor() {
    // Initialize console interceptor
    this.interceptConsole();
  }

  // ... keep existing code (logger methods and console interception)

  /**
   * Track API credential usage
   */
  trackApiPayload(
    filePath: string,
    functionName: string,
    stage: string,
    apiId: any,
    apiHash: string,
    phoneNumber?: string,
    otherData?: any
  ): void {
    console.log(`[API-PAYLOAD-TRACKER] Tracking at ${filePath} (${stage}): 
      - apiId: ${apiId} (${typeof apiId})
      - apiHash: ${apiHash ? apiHash.substring(0, 6) + '...' : 'undefined'} (${typeof apiHash})
      - phoneNumber: ${phoneNumber ? phoneNumber.substring(0, 4) + '****' : 'undefined'} (${typeof phoneNumber})`);
      
    this.apiPayloads.unshift({
      timestamp: new Date(),
      filePath,
      functionName,
      stage,
      apiId: {
        value: apiId,
        type: typeof apiId
      },
      apiHash: {
        value: apiHash ? `${apiHash.substring(0, 6)}...` : '[undefined]',
        type: typeof apiHash
      },
      phoneNumber: {
        value: phoneNumber ? `${phoneNumber.substring(0, 4)}****` : '[undefined]',
        type: typeof phoneNumber
      },
      otherData
    });
    
    // Keep track of only the last 50 payloads
    if (this.apiPayloads.length > 50) {
      this.apiPayloads = this.apiPayloads.slice(0, 50);
    }
  }

  getApiPayloads(): ApiPayloadEntry[] {
    return this.apiPayloads;
  }

  // ... keep existing code (other methods)
}

export interface ApiPayloadEntry {
  timestamp: Date;
  filePath: string;
  functionName: string;
  stage: string;
  apiId: {
    value: any;
    type: string;
  };
  apiHash: {
    value: string;
    type: string;
  };
  phoneNumber: {
    value: string;
    type: string;
  };
  otherData?: any;
}

// ... keep existing code (export the logger instance)

/**
 * Track API call for debugging
 */
export function trackApiCall(
  endpoint: string,
  requestData: any,
  responseData: any,
  error: any = null
): void {
  try {
    // Extract API credentials for tracking
    const apiId = requestData?.apiId;
    const apiHash = requestData?.apiHash;
    const phoneNumber = requestData?.phoneNumber;
    
    // Track the API payload
    consoleLogger.trackApiPayload(
      'services/telegram/connector.ts',
      'trackApiCall',
      error ? 'api-call-error' : 'api-call-complete',
      apiId,
      apiHash,
      phoneNumber,
      { 
        endpoint, 
        status: error ? 'error' : 'success',
        error: error ? (error.message || String(error)) : undefined
      }
    );
    
    // Log the API call
    logInfo('ApiTracker', `API Call to ${endpoint}`, {
      success: !error,
      hasResponse: !!responseData,
      error: error ? (error.message || String(error)) : undefined
    });
  } catch (trackingError) {
    logError('ApiTracker', 'Error tracking API call', trackingError);
  }
}

// ... keep existing code (other exports)
