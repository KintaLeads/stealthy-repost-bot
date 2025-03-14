
/**
 * Debugging utilities for Telegram services
 */

// Define log entry types
export interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  source: string;
  message: string;
  data?: any;
}

// Define API payload tracking entry
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
  session?: {
    value: string;
    type: string;
    length: number;
  };
  otherData?: any;
}

class ConsoleDebugger {
  private logs: LogEntry[] = [];
  private apiPayloads: ApiPayloadEntry[] = [];
  private maxLogs = 500;

  constructor() {
    // Initialize console interceptor
    this.interceptConsole();
  }

  // Intercept console methods to capture logs
  private interceptConsole(): void {
    const originalConsole = { ...console };
    
    console.log = (...args: any[]) => {
      originalConsole.log(...args);
      this.addLog('info', 'console', args.map(arg => String(arg)).join(' '));
    };
    
    console.warn = (...args: any[]) => {
      originalConsole.warn(...args);
      this.addLog('warn', 'console', args.map(arg => String(arg)).join(' '));
    };
    
    console.error = (...args: any[]) => {
      originalConsole.error(...args);
      this.addLog('error', 'console', args.map(arg => String(arg)).join(' '));
    };
  }
  
  // Add a log entry
  private addLog(level: LogEntry['level'], source: string, message: string, data?: any): void {
    this.logs.unshift({
      timestamp: new Date(),
      level,
      source,
      message,
      data
    });
    
    // Trim logs if over limit
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
  }
  
  // Get all logs
  getLogs(): LogEntry[] {
    return this.logs;
  }
  
  // Clear logs
  clearLogs(): void {
    this.logs = [];
  }

  /**
   * Track API credential usage
   */
  trackApiPayload(
    filePath: string,
    functionName: string,
    stage: string,
    apiId: any,
    apiHash: string,
    phoneNumber: string,
    sessionString: string = "",
    otherData?: any
  ): void {
    console.log(`[API-PAYLOAD-TRACKER] Tracking at ${filePath} (${stage}): 
      - apiId: ${apiId} (${typeof apiId})
      - apiHash: ${apiHash ? apiHash.substring(0, 6) + '...' : 'undefined'} (${typeof apiHash})
      - phoneNumber: ${phoneNumber ? phoneNumber.substring(0, 4) + '****' : 'undefined'} (${typeof phoneNumber})
      - session: ${sessionString ? `[${sessionString.length} chars]` : '[none]'} (${typeof sessionString})`);
      
    // Ensure sessionString is a string (empty string if missing)
    const safeSessionString = typeof sessionString === 'string' ? sessionString : "";
    
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
      session: {
        value: safeSessionString ? 
          `${safeSessionString.substring(0, 10)}...${safeSessionString.substring(Math.max(0, safeSessionString.length - 10))}` : 
          '[none]',
        type: typeof safeSessionString,
        length: safeSessionString.length
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

  // Helper methods for logging
  logInfo(source: string, message: string, data?: any): void {
    this.addLog('info', source, message, data);
  }
  
  logWarning(source: string, message: string, data?: any): void {
    this.addLog('warn', source, message, data);
  }
  
  logError(source: string, message: string, data?: any): void {
    this.addLog('error', source, message, data);
  }
  
  logDebug(source: string, message: string, data?: any): void {
    this.addLog('debug', source, message, data);
  }
}

// Create a singleton instance
export const consoleLogger = new ConsoleDebugger();

// Export convenience methods
export const logInfo = (source: string, message: string, data?: any) => {
  consoleLogger.logInfo(source, message, data);
};

export const logWarning = (source: string, message: string, data?: any) => {
  consoleLogger.logWarning(source, message, data);
};

export const logError = (source: string, message: string, data?: any) => {
  consoleLogger.logError(source, message, data);
};

export const logDebug = (source: string, message: string, data?: any) => {
  consoleLogger.logDebug(source, message, data);
};

/**
 * Track API credentials for debugging
 */
export function trackApiCredentials(
  filePath: string,
  functionName: string,
  stage: string,
  apiId: any,
  apiHash: string,
  phoneNumber?: string | any,
  sessionString: string = "",
  otherData?: any
): void {
  try {
    // Handle case where phoneNumber might be in otherData
    let phoneNumberValue = phoneNumber;
    let sessionValue = sessionString;
    
    // If phoneNumber is an object, it might be the otherData parameter
    if (typeof phoneNumber === 'object' && phoneNumber !== null) {
      otherData = phoneNumber; // Move it to otherData
      phoneNumberValue = otherData.phoneNumber || undefined; // Extract phone number if available
      sessionValue = otherData.sessionString || ""; // Extract session if available
    }
    
    consoleLogger.trackApiPayload(
      filePath,
      functionName,
      stage,
      apiId,
      apiHash,
      phoneNumberValue,
      sessionValue,
      otherData
    );
  } catch (error) {
    console.error('Error tracking API credentials:', error);
  }
}

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
    const sessionString = requestData?.sessionString || "";
    
    // Track the API payload
    consoleLogger.trackApiPayload(
      'services/telegram/connector.ts',
      'trackApiCall',
      error ? 'api-call-error' : 'api-call-complete',
      apiId,
      apiHash,
      phoneNumber,
      sessionString,
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
      sessionProvided: !!sessionString,
      error: error ? (error.message || String(error)) : undefined
    });
  } catch (trackingError) {
    logError('ApiTracker', 'Error tracking API call', trackingError);
  }
}
