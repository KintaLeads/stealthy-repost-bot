
/**
 * Console debugger component to display all logs
 */
export class ConsoleDebugger {
  private static instance: ConsoleDebugger;
  private logs: Array<{
    level: 'info' | 'warn' | 'error',
    timestamp: Date,
    message: string,
    data?: any
  }> = [];
  
  private constructor() {
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
    // Store the original console methods
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    
    // Override the console methods to capture logs
    console.log = (...args: any[]) => {
      // Call the original method
      originalLog.apply(console, args);
      
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
      originalWarn.apply(console, args);
      
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
      originalError.apply(console, args);
      
      // Add to our logs
      this.logs.push({
        level: 'error',
        timestamp: new Date(),
        message: args[0],
        data: args.length > 1 ? args.slice(1) : undefined
      });
    };
  }
  
  public getLogs() {
    return [...this.logs];
  }
  
  public clearLogs() {
    this.logs = [];
  }
}

// Initialize the console debugger
export const consoleLogger = ConsoleDebugger.getInstance();
