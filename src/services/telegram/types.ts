
export interface ConnectionResult {
  success: boolean;
  codeNeeded?: boolean;
  phoneCodeHash?: string;
  session?: string;
  user?: any;
  error?: string;
  _testCode?: string;
}
