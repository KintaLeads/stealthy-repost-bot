import { ApiAccount } from "@/types/channels";
import { logInfo, logError } from '../debugger';

const SESSION_KEY_PREFIX = 'telegram_session_';

export const getSessionKey = (accountId: string): string => {
  return `${SESSION_KEY_PREFIX}${accountId}`;
};

export const getStoredSession = (accountId: string): string | null => {
  try {
    const key = getSessionKey(accountId);
    const session = localStorage.getItem(key);
    logInfo("SessionManager", `Session ${session ? 'found' : 'not found'} for account ${accountId}`);
    return session;
  } catch (error) {
    logError("SessionManager", "Error getting stored session:", error);
    return null;
  }
};

export const storeSession = (accountId: string, sessionString: string): void => {
  try {
    if (!sessionString) {
      logError("SessionManager", "Attempted to store empty session");
      return;
    }
    const key = getSessionKey(accountId);
    localStorage.setItem(key, sessionString);
    logInfo("SessionManager", `Session stored for account ${accountId}`);
  } catch (error) {
    logError("SessionManager", "Error storing session:", error);
  }
};

export const hasStoredSession = (accountId: string): boolean => {
  try {
    const key = getSessionKey(accountId);
    const session = localStorage.getItem(key);
    logInfo("SessionManager", `Checking session exists for account ${accountId}: ${!!session}`);
    return !!session;
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
  const session = getStoredSession(account.id);
  if (!session) {
    logInfo("SessionManager", "No session found for validation");
    return false;
  }
  // We'll validate the session by attempting to use it
  return true;
};
