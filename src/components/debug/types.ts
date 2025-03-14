
/**
 * Type definitions for debug components
 */

export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug'; // Added 'debug' to match debugger.ts
  timestamp: Date;
  message: string;
  data?: any;
}

export interface DiagnosticResultData {
  supabase: boolean;
  telegram: boolean;
  edgeFunction: {
    deployed: boolean;
    url: string;
    error?: string;
  };
  cors?: {
    success: boolean;
    status?: number;
    corsHeaders?: Record<string, string | null>;
    error?: string;
    postTest?: {
      success: boolean;
      status?: number;
      error?: string;
    };
  };
}
