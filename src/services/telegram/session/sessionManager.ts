
import { ApiAccount } from "@/types/channels";
import { logInfo, logError } from '../debugger';

const SESSION_KEY_PREFIX = 'telegram_session_';

export const getSessionKey = (accountId: string): string => {
  return `${SESSION_KEY_PREFIX}${accountId}`;
};

export const getStoredSession = (accountId: string): string => {
  try {
    const key = getSessionKey(accountId);
    const sessionString = localStorage.getItem(key);
    
    // CRITICAL FIX: Never return "[NONE]" or "[none]" in any case variation
    // Check for invalid sessions using case-insensitive regex
    if (!sessionString || /^\[NONE\]$/i.test(sessionString) || sessionString.trim().length === 0) {
      logInfo("SessionManager", `No valid session found for account ${accountId}`);
      return "";
    }
    
    logInfo("SessionManager", `Session found for account ${accountId}, length: ${sessionString.length}`);
    return sessionString.trim();
  } catch (error) {
    logError("SessionManager", "Error getting stored session:", error);
    return "";
  }
};

export const storeSession = (accountId: string, sessionString: string): void => {
  try {
    // CRITICAL FIX: Never store "[NONE]" or "[none]" in any case variation
    if (!sessionString || /^\[NONE\]$/i.test(sessionString) || sessionString.trim().length === 0) {
      logError("SessionManager", "Attempted to store invalid session - aborting");
      return;
    }
    
    const key = getSessionKey(accountId);
    localStorage.setItem(key, sessionString.trim());
    logInfo("SessionManager", `Session stored for account ${accountId}, length: ${sessionString.trim().length}`);
  } catch (error) {
    logError("SessionManager", "Error storing session:", error);
  }
};

export const hasStoredSession = (accountId: string): boolean => {
  try {
    const key = getSessionKey(accountId);
    const sessionString = localStorage.getItem(key);
    
    // CRITICAL FIX: Check more thoroughly for valid sessions with case-insensitive regex
    const isValidSession = sessionString && 
                          !/^\[NONE\]$/i.test(sessionString) && 
                          sessionString.trim().length > 0;
    
    logInfo("SessionManager", `Checking session exists for account ${accountId}: ${!!isValidSession}`);
    return !!isValidSession;
  } catch (error) {
    logError("SessionManager", "Error checking session existence:", error);
    return false;
  }
};

export const clearSession = (accountId: string): void => {
  try {
    const key = getSessionKey(accountId);
    localStorage.removeItem(key);
    logInfo("SessionManager", `Session cleared for account ${accountId}`);
  } catch (error) {
    logError("SessionManager", "Error clearing session:", error);
  }
};

export const validateSession = async (account: ApiAccount): Promise<boolean> => {
  const sessionString = getStoredSession(account.id);
  if (!sessionString) {
    logInfo("SessionManager", "No session found for validation");
    return false;
  }
  // We'll validate the session by attempting to use it
  return true;
};
