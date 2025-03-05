
import { TelegramSession } from "./types";

// Local storage keys
const SESSIONS_STORAGE_KEY = 'telegram_sessions';

/**
 * Store the Telegram session in localStorage for a specific account
 */
export const storeSession = (accountId: string, sessionString: string): void => {
  // Get existing sessions
  const existingSessions = getAllSessions();
  
  const session: TelegramSession = {
    accountId,
    sessionString,
    createdAt: new Date()
  };
  
  // Add or update the session for this account
  existingSessions[accountId] = session;
  
  // Save back to localStorage
  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(existingSessions));
};

/**
 * Get the stored session for a specific account if valid (not older than 1 day)
 */
export const getStoredSession = (accountId: string): string | null => {
  const sessions = getAllSessions();
  const session = sessions[accountId];
  
  if (!session) return null;
  
  // Check if session is older than 1 day
  const now = new Date();
  const sessionDate = new Date(session.createdAt);
  
  if ((now.getTime() - sessionDate.getTime()) > 24 * 60 * 60 * 1000) {
    // Remove expired session
    clearStoredSession(accountId);
    return null;
  }
  
  return session.sessionString;
};

/**
 * Get all stored sessions
 */
export const getAllSessions = (): Record<string, TelegramSession> => {
  const sessionsJson = localStorage.getItem(SESSIONS_STORAGE_KEY);
  
  if (!sessionsJson) return {};
  
  try {
    return JSON.parse(sessionsJson);
  } catch (error) {
    console.error('Error parsing stored sessions:', error);
    localStorage.removeItem(SESSIONS_STORAGE_KEY);
    return {};
  }
};

/**
 * Clear the stored session for a specific account
 */
export const clearStoredSession = (accountId: string): void => {
  const sessions = getAllSessions();
  
  if (sessions[accountId]) {
    delete sessions[accountId];
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  }
};

/**
 * Clear all stored sessions
 */
export const clearAllSessions = (): void => {
  localStorage.removeItem(SESSIONS_STORAGE_KEY);
};
