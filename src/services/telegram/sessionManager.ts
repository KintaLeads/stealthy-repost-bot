
import { logInfo } from './debugger';

const SESSION_PREFIX = 'telegram_session_';

/**
 * Get the stored session for an account, optionally storing a new one
 * if provided
 */
export const getStoredSession = (accountId: string, sessionString?: string): string => {
  if (sessionString) {
    // If a session string is provided, store it
    const key = `${SESSION_PREFIX}${accountId}`;
    localStorage.setItem(key, sessionString);
    logInfo('SessionManager', `Session stored for account ${accountId}`);
  }
  
  // Get the stored session string
  const key = `${SESSION_PREFIX}${accountId}`;
  const storedSession = localStorage.getItem(key);
  
  return storedSession || '';
};

/**
 * Clear the stored session for an account
 */
export const clearStoredSession = (accountId: string): void => {
  const key = `${SESSION_PREFIX}${accountId}`;
  localStorage.removeItem(key);
  logInfo('SessionManager', `Session cleared for account ${accountId}`);
};
