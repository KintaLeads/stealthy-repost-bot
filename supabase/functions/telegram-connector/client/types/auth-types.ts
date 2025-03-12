
/**
 * Authentication state types
 */

// Re-export AuthState for backward compatibility
import { AuthState } from "../types.ts";
export { AuthState };

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
