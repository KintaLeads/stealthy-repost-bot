
export interface ConnectionResult {
  success: boolean;
  codeNeeded?: boolean;
  phoneCodeHash?: string;
  session?: string;
  user?: any;
  error?: string;
  _testCode?: string;
  needsVerification?: boolean;
}

export interface ConnectionOptions {
  verificationCode?: string;
  phoneCodeHash?: string;
  testOnly?: boolean;
  debug?: boolean;
}
