
import { logInfo, logWarning } from './debugger';
import { runConnectivityChecks as runBasicConnectivityChecks } from './networkConnectivity';
import { testCorsConfiguration as testCorsSetting } from './corsChecker';

// Re-export the functions with the same names to maintain compatibility
export const runConnectivityChecks = runBasicConnectivityChecks;
export const testCorsConfiguration = testCorsSetting;
