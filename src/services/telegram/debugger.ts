
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
    };
    
    console.error = (...args: any[]) => {
      // Call the original method
      this.originalConsoleMethods.error.apply(console, args);
      
      // Add to our logs with better error formatting
      const errorData = args.length > 1 ? args.slice(1) : undefined;
      
      // Special handling for Error objects
      let formattedError = errorData;
      if (args[0] instanceof Error) {
        // Format error object properties as a regular object, not trying to add to an array
        formattedError = {
          name: args[0].name,
          message: args[0].message,
          stack: args[0].stack,
          additionalData: errorData
        };
      }
      
      this.logs.push({
        level: 'error',
        timestamp: new Date(),
        message: typeof args[0] === 'string' ? args[0] : args[0] instanceof Error ? args[0].message : String(args[0]),
        data: formattedError
      });
    };
  }
  
  public getLogs() {
    return [...this.logs];
  }
  
  public clearLogs() {
    this.logs = [];
  }
  
  public getErrorLogs() {
    return this.logs.filter(log => log.level === 'error');
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
