
/**
 * Type definitions for debug components
 */

export interface LogEntry {
  level: 'info' | 'warn' | 'error';
  timestamp: Date;
  message: string;
  data?: any;
}
