
import { logInfo } from './debugger';

const SESSION_PREFIX = 'telegram_session_';

/**
 * Get the stored session for an account, optionally storing a new one
 * if provided
 */
export const getStoredSession = (accountId: string, sessionString?: string): string => {
  logInfo('SessionManager', `Getting session for account ${accountId}${sessionString ? ' and storing new session' : ''}`);
  
  if (sessionString) {
    // If a session string is provided, store it
    const key = `${SESSION_PREFIX}${accountId}`;
    localStorage.setItem(key, sessionString);
    logInfo('SessionManager', `Session stored for account ${accountId}`);
  }
  
  // Get the stored session string
  const key = `${SESSION_PREFIX}${accountId}`;
  const storedSession = localStorage.getItem(key);
  
  logInfo('SessionManager', `Session ${storedSession ? 'found' : 'not found'} for account ${accountId}`);
  
  return storedSession || '';
};

/**
 * Store a session for an account
 */
export const storeSession = (accountId: string, sessionString: string): void => {
  if (!sessionString) {
    logInfo('SessionManager', `Attempted to store empty session for account ${accountId}, ignoring`);
    return;
  }
  
  const key = `${SESSION_PREFIX}${accountId}`;
  localStorage.setItem(key, sessionString);
  logInfo('SessionManager', `Session stored for account ${accountId}`);
};

/**
 * Clear the stored session for an account
 */
export const clearStoredSession = (accountId: string): void => {
  const key = `${SESSION_PREFIX}${accountId}`;
  localStorage.removeItem(key);
  logInfo('SessionManager', `Session cleared for account ${accountId}`);
};

/**
 * Check if a session exists for an account
 */
export const hasStoredSession = (accountId: string): boolean => {
  const key = `${SESSION_PREFIX}${accountId}`;
  const storedSession = localStorage.getItem(key);
  logInfo('SessionManager', `Checking session for account ${accountId}: ${!!storedSession}`);
  return !!storedSession;
};
