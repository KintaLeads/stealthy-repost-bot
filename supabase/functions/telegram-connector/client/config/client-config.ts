
/**
 * Client configuration types and utilities
 */

/**
 * Base configuration for Telegram client
 */
export interface ClientConfig {
  apiId: string;
  apiHash: string;
  phoneNumber: string;
  accountId: string;
  sessionString: string;
}

/**
 * Validate client configuration
 */
export function validateClientConfig(config: ClientConfig): void {
  // Validate API ID
  if (!config.apiId || config.apiId === 'undefined' || config.apiId === 'null' || config.apiId.trim() === '') {
    console.error("CRITICAL ERROR: Invalid API ID in configuration:", config.apiId);
    throw new Error(`API ID cannot be empty or invalid, received: ${JSON.stringify(config.apiId)}`);
  }
  
  // Validate API Hash
  if (!config.apiHash || config.apiHash === 'undefined' || config.apiHash === 'null' || config.apiHash.trim() === '') {
    console.error("CRITICAL ERROR: Invalid API Hash in configuration");
    throw new Error(`API Hash cannot be empty or invalid, received: ${JSON.stringify(config.apiHash)}`);
  }
}

