
/**
 * Session storage manager for Telegram API connections
 */

// Constants for storing sessions
const SESSION_PREFIX = 'telegram_session_';

/**
 * Store a session in localStorage
 */
export const storeSession = (accountId: string, session: string): void => {
  if (!accountId) {
    console.error('Cannot store session: Missing account ID');
    return;
  }
  
  // Don't store empty or invalid sessions
  if (!session || session === '[NONE]') {
    console.warn(`Not storing empty or invalid session for account ${accountId}`);
    return;
  }
  
  const key = `${SESSION_PREFIX}${accountId}`;
  
  try {
    localStorage.setItem(key, session);
    console.log(`Session stored for account ${accountId} (length: ${session.length})`);
  } catch (error) {
    console.error('Error storing session:', error);
  }
};

/**
 * Retrieve a stored session from localStorage
 */
export const getStoredSession = (accountId: string): string => {
  if (!accountId) {
    console.error('Cannot get session: Missing account ID');
    return '';
  }
  
  const key = `${SESSION_PREFIX}${accountId}`;
  
  try {
    const session = localStorage.getItem(key);
    
    // Check if the session is null, undefined, or "[NONE]"
    if (!session || session === '[NONE]') {
      console.log(`No valid session found for account ${accountId}`);
      return '';
    }
    
    console.log(`Retrieved session for account ${accountId} (length: ${session.length})`);
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return '';
  }
};

/**
 * Remove a stored session from localStorage
 */
export const clearStoredSession = (accountId: string): void => {
  if (!accountId) {
    console.error('Cannot clear session: Missing account ID');
    return;
  }
  
  const key = `${SESSION_PREFIX}${accountId}`;
  
  try {
    localStorage.removeItem(key);
    console.log(`Session cleared for account ${accountId}`);
  } catch (error) {
    console.error('Error clearing session:', error);
  }
};

/**
 * Check if a session exists for an account
 */
export const hasStoredSession = (accountId: string): boolean => {
  if (!accountId) {
    return false;
  }
  
  const session = getStoredSession(accountId);
  return !!session && session.length > 0;
};
