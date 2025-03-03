
/**
 * Utility functions for processing message text
 */

/**
 * Detects competitor usernames in message text
 * Looks for @ mentions and Telegram usernames at the end of URLs
 * @param text The message text to analyze
 * @param competitorUsernames Array of known competitor usernames to match against
 * @returns Array of detected competitor usernames
 */
export const detectCompetitorMentions = (
  text: string,
  competitorUsernames: string[]
): string[] => {
  if (!text || !competitorUsernames.length) return [];
  
  const detectedCompetitors: string[] = [];
  
  // Convert to lowercase for case-insensitive comparison
  const lowerText = text.toLowerCase();
  const lowerCompetitors = competitorUsernames.map(name => name.toLowerCase());
  
  // Pattern for @username mentions
  const mentionRegex = /@([a-z0-9_]{5,32})/gi;
  const mentionMatches = [...text.matchAll(mentionRegex)];
  
  // Pattern for t.me/username or telegram.me/username links
  const linkRegex = /(?:t\.me|telegram\.me)\/([a-z0-9_]{5,32})/gi;
  const linkMatches = [...text.matchAll(linkRegex)];
  
  // Combine all potential usernames found
  const potentialUsernames: string[] = [
    ...mentionMatches.map(match => match[1]?.toLowerCase()),
    ...linkMatches.map(match => match[1]?.toLowerCase())
  ].filter(Boolean);
  
  // Check if any potential username matches known competitors
  for (const username of potentialUsernames) {
    if (lowerCompetitors.includes(username) && !detectedCompetitors.includes(username)) {
      detectedCompetitors.push(username);
    }
  }
  
  return detectedCompetitors;
};

/**
 * Replaces competitor usernames in message text with the user's own username
 * @param text The original message text
 * @param detectedCompetitors Array of detected competitor usernames
 * @param replacementUsername The username to replace competitors with
 * @returns Modified text with replaced usernames
 */
export const replaceCompetitorMentions = (
  text: string,
  detectedCompetitors: string[],
  replacementUsername: string
): string => {
  if (!text || !detectedCompetitors.length || !replacementUsername) return text;
  
  let modifiedText = text;
  
  // Replace @username mentions
  for (const competitor of detectedCompetitors) {
    const mentionRegex = new RegExp(`@${competitor}`, 'gi');
    modifiedText = modifiedText.replace(mentionRegex, `@${replacementUsername}`);
    
    // Replace t.me/username or telegram.me/username links
    const linkRegex = new RegExp(`(t\\.me|telegram\\.me)\\/${competitor}`, 'gi');
    modifiedText = modifiedText.replace(linkRegex, `$1/${replacementUsername}`);
  }
  
  return modifiedText;
};

/**
 * Adds a call-to-action message with the provided username
 * @param text The original message text
 * @param username The username to include in the CTA
 * @returns Text with appended CTA
 */
export const appendCallToAction = (
  text: string,
  username: string
): string => {
  if (!text || !username) return text;
  
  // Remove @ prefix if present
  const cleanUsername = username.startsWith('@') ? username : `@${username}`;
  
  // Append CTA to the message
  return `${text}\n\n🚀 Let's start trading together now! -> ${cleanUsername} 💸`;
};

/**
 * Process message text fully - detect competitors, replace mentions, and append CTA
 * @param text The original message text
 * @param competitorUsernames Array of known competitor usernames 
 * @param replacementUsername The username to replace competitors with
 * @returns Object with processed text information
 */
export const processMessageText = (
  text: string,
  competitorUsernames: string[],
  replacementUsername: string
): {
  detectedCompetitors: string[];
  modifiedText: string;
  finalText: string;
} => {
  // Step 1: Detect competitor mentions
  const detectedCompetitors = detectCompetitorMentions(text, competitorUsernames);
  
  // Step 2: Replace competitor mentions with user's username
  const modifiedText = detectedCompetitors.length > 0
    ? replaceCompetitorMentions(text, detectedCompetitors, replacementUsername)
    : text;
  
  // Step 3: Append call-to-action
  const finalText = appendCallToAction(modifiedText, replacementUsername);
  
  return {
    detectedCompetitors,
    modifiedText,
    finalText
  };
};
