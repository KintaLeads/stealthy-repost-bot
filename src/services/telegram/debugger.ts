
/**
 * Console debugger component to display all logs with enhanced error tracking
 */
export class ConsoleDebugger {
  private static instance: ConsoleDebugger;
  private logs: Array<{
    level: 'info' | 'warn' | 'error',
    timestamp: Date,
    message: string,
    data?: any
  }> = [];
  
  private apiPayloads: Array<{
    timestamp: Date,
    filePath: string, 
    functionName: string,
    stage: string,
    apiId: {
      value: any,
      type: string
    },
    apiHash: {
      value: string,
      type: string
    },
    otherData?: any
  }> = [];
  
  private originalConsoleMethods: {
    log: typeof console.log;
    warn: typeof console.warn;
    error: typeof console.error;
  };
  
  private constructor() {
    // Store original console methods before hijacking
    this.originalConsoleMethods = {
      log: console.log,
      warn: console.warn,
      error: console.error
    };
    
    // Private constructor to enforce singleton pattern
    this.hijackConsole();
  }
  
  public static getInstance(): ConsoleDebugger {
    if (!ConsoleDebugger.instance) {
      ConsoleDebugger.instance = new ConsoleDebugger();
    }
    return ConsoleDebugger.instance;
  }
  
  private hijackConsole() {
    // Override the console methods to capture logs
    console.log = (...args: any[]) => {
      // Call the original method
      this.originalConsoleMethods.log.apply(console, args);
      
      // Add to our logs
      this.logs.push({
        level: 'info',
        timestamp: new Date(),
        message: args[0],
        data: args.length > 1 ? args.slice(1) : undefined
      });
      
      // Auto-track API credentials if they appear in logs
      this.tryExtractApiCredentials('console.log', String(args[0]), args.slice(1));
    };
    
    console.warn = (...args: any[]) => {
      // Call the original method
      this.originalConsoleMethods.warn.apply(console, args);
      
      // Add to our logs
      this.logs.push({
        level: 'warn',
        timestamp: new Date(),
        message: args[0],
        data: args.length > 1 ? args.slice(1) : undefined
      });
      
      // Auto-track API credentials if they appear in logs
      this.tryExtractApiCredentials('console.warn', String(args[0]), args.slice(1));
    };
    
    console.error = (...args: any[]) => {
      // Call the original method
      this.originalConsoleMethods.error.apply(console, args);
      
      // Add to our logs with better error formatting
      const errorData = args.length > 1 ? args.slice(1) : undefined;
      
      // Special handling for Error objects
      let formattedError: any = {}; // Initialize as empty object
      if (args[0] instanceof Error) {
        formattedError = {
          name: args[0].name,
          message: args[0].message,
          stack: args[0].stack,
          additionalData: errorData
        };
      } else if (errorData) {
        formattedError = errorData;
      }
      
      this.logs.push({
        level: 'error',
        timestamp: new Date(),
        message: typeof args[0] === 'string' ? args[0] : args[0] instanceof Error ? args[0].message : String(args[0]),
        data: formattedError
      });
      
      // Auto-track API credentials if they appear in logs
      this.tryExtractApiCredentials('console.error', String(args[0]), args.slice(1));
    };
  }
  
  private tryExtractApiCredentials(functionName: string, message: string, args: any[]) {
    // Look for typical patterns in log messages
    if (message.includes('apiId') || message.includes('API ID') || 
        message.includes('apiHash') || message.includes('API Hash')) {
      
      // Try to extract api credentials
      let apiId: any = null;
      let apiHash: any = null;
      let otherData: any = {};
      
      // Check message for details
      if (message.includes('apiId')) {
        const match = message.match(/apiId:?\s*([^,)(\n\s]+)/i);
        if (match && match[1]) {
          apiId = match[1].trim();
        }
      }
      
      if (message.includes('apiHash')) {
        const match = message.match(/apiHash:?\s*([^,)(\n\s]+)/i);
        if (match && match[1]) {
          apiHash = match[1].trim();
        }
      }
      
      // Check the args too
      if (args && args.length > 0) {
        args.forEach(arg => {
          if (typeof arg === 'object' && arg !== null) {
            if ('apiId' in arg) apiId = arg.apiId;
            if ('api_id' in arg) apiId = arg.api_id;
            if ('apiHash' in arg) apiHash = arg.apiHash;
            if ('api_hash' in arg) apiHash = arg.api_hash;
            
            // Collect other useful debugging data
            otherData = { ...otherData, ...arg };
          }
        });
      }
      
      if (apiId || apiHash) {
        // Get file path from error stack if possible
        let filePath = 'unknown';
        let callerFn = functionName;
        
        try {
          const stackLines = new Error().stack?.split('\n') || [];
          // Look for a non-debugger file in the stack
          for (let i = 2; i < stackLines.length; i++) { // Skip first 2 lines (Error and this function)
            const line = stackLines[i];
            if (line && !line.includes('debugger.ts') && !line.includes('console.')) {
              const fileMatch = line.match(/\((.+?):\d+:\d+\)/) || line.match(/at\s+(.+?):\d+:\d+/);
              if (fileMatch && fileMatch[1]) {
                filePath = fileMatch[1];
                // Extract function name if available
                const fnMatch = line.match(/at\s+([^(]+)\s+\(/) || line.match(/at\s+new\s+([^(]+)\s+\(/);
                if (fnMatch && fnMatch[1]) {
                  callerFn = fnMatch[1].trim();
                }
                break;
              }
            }
          }
        } catch (e) {
          // Ignore stack parsing errors
        }
        
        // Track the credentials
        this.trackApiCredentials(
          filePath,
          callerFn,
          'auto-extracted',
          apiId,
          apiHash,
          otherData
        );
      }
    }
  }
  
  public getLogs() {
    return [...this.logs];
  }
  
  public clearLogs() {
    this.logs = [];
    this.apiPayloads = [];
  }
  
  public getErrorLogs() {
    return this.logs.filter(log => log.level === 'error');
  }
  
  public getApiPayloads() {
    return [...this.apiPayloads];
  }
  
  public logWithContext(level: 'info' | 'warn' | 'error', context: string, message: string, data?: any) {
    const contextualMessage = `[${context}] ${message}`;
    
    switch (level) {
      case 'info':
        console.log(contextualMessage, data);
        break;
      case 'warn':
        console.warn(contextualMessage, data);
        break;
      case 'error':
        console.error(contextualMessage, data);
        break;
    }
  }
  
  public trackApiCall(endpoint: string, requestData: any, response?: any, error?: any) {
    const maskedRequestData = { ...requestData };
    
    // Mask sensitive data
    if (maskedRequestData.apiHash) maskedRequestData.apiHash = '********';
    if (maskedRequestData.verificationCode) maskedRequestData.verificationCode = '******';
    
    if (error) {
      console.error(`API Call to ${endpoint} failed`, {
        request: maskedRequestData,
        error: error
      });
    } else {
      console.log(`API Call to ${endpoint} completed`, {
        request: maskedRequestData,
        response: response
      });
    }
    
    // Also track the API credentials from the request
    if (requestData && (requestData.apiId || requestData.apiHash)) {
      this.trackApiCredentials(
        'api-call',
        endpoint,
        'request',
        requestData.apiId,
        requestData.apiHash,
        { 
          endpoint,
          status: error ? 'error' : 'success'
        }
      );
    }
  }
  
  /**
   * Track API credentials as they move through the system
   */
  public trackApiCredentials(
    filePath: string,
    functionName: string,
    stage: string,
    apiId: any,
    apiHash: any,
    otherData?: any
  ) {
    // Create a payload entry with types and values
    const payloadEntry = {
      timestamp: new Date(),
      filePath,
      functionName,
      stage,
      apiId: {
        value: apiId instanceof Error ? apiId.message : apiId,
        type: typeof apiId
      },
      apiHash: {
        value: typeof apiHash === 'string' ? (apiHash.length > 6 ? `${apiHash.substring(0, 6)}...` : apiHash) : String(apiHash),
        type: typeof apiHash
      },
      otherData
    };
    
    // Log the credentials for immediate visibility
    console.log(`[API CREDENTIALS TRACKER] ${filePath} - ${functionName} - ${stage}`, {
      apiId: payloadEntry.apiId,
      apiHash: payloadEntry.apiHash,
      otherData
    });
    
    // Add to our tracked payloads
    this.apiPayloads.push(payloadEntry);
  }
}

// Initialize the console debugger
export const consoleLogger = ConsoleDebugger.getInstance();

// Convenience exports for different log levels
export const logInfo = (context: string, message: string, data?: any) => 
  consoleLogger.logWithContext('info', context, message, data);

export const logWarning = (context: string, message: string, data?: any) => 
  consoleLogger.logWithContext('warn', context, message, data);

export const logError = (context: string, message: string, data?: any) => 
  consoleLogger.logWithContext('error', context, message, data);

export const trackApiCall = consoleLogger.trackApiCall.bind(consoleLogger);

export const trackApiCredentials = consoleLogger.trackApiCredentials.bind(consoleLogger);
