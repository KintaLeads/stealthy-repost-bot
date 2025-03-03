
import { TelegramSession } from "./types";

// Local storage keys
const SESSION_STORAGE_KEY = 'telegram_session';

/**
 * Store the Telegram session in localStorage
 */
export const storeSession = (sessionString: string): void => {
  const session: TelegramSession = {
    sessionString,
    createdAt: new Date()
  };
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
};

/**
 * Get the stored session if valid (not older than 1 day)
 */
export const getStoredSession = (): string | null => {
  const sessionJson = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!sessionJson) return null;
  
  try {
    const session: TelegramSession = JSON.parse(sessionJson);
    const now = new Date();
    const sessionDate = new Date(session.createdAt);
    
    // Check if session is older than 1 day
    if ((now.getTime() - sessionDate.getTime()) > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    
    return session.sessionString;
  } catch (error) {
    console.error('Error parsing stored session:', error);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
};

/**
 * Clear the stored session
 */
export const clearStoredSession = (): void => {
  localStorage.removeItem(SESSION_STORAGE_KEY);
};
