
/**
 * Authentication state types
 */

// Auth state definition
export type AuthState = "unauthorized" | "awaiting_code" | "authorized";

// Authentication result interface
export interface AuthenticationResult {
  success: boolean;
  codeNeeded?: boolean;
  phoneCodeHash?: string;
  error?: string;
  session?: string;
  _testCode?: string;
}

// Verification result interface
export interface VerificationResult {
  success: boolean;
  error?: string;
  session?: string;
}
