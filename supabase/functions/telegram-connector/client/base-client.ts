
// Base client class that provides common functionality using direct HTTP requests
export type AuthState = 'not_started' | 'awaiting_verification' | 'authenticated' | 'error';

export class BaseTelegramClient {
  protected apiId: string;
  protected apiHash: string;
  protected phoneNumber: string;
  protected accountId: string;
  protected sessionString: string;
  protected authState: AuthState = 'not_started';
  
  constructor(apiId: string, apiHash: string, phoneNumber: string, accountId: string, sessionString: string = "") {
    console.log("Creating BaseTelegramClient with direct HTTP implementation");
    this.apiId = apiId;
    this.apiHash = apiHash;
    this.phoneNumber = phoneNumber;
    this.accountId = accountId;
    this.sessionString = sessionString || "";
  }
  
  /**
   * Gets the current auth state
   */
  getAuthState(): AuthState {
    return this.authState;
  }
  
  /**
   * Get the session string
   */
  getSession(): string {
    return this.sessionString;
  }
  
  /**
   * Check if the client is authenticated based on session string
   */
  async isAuthenticated(): Promise<boolean> {
    if (!this.sessionString) {
      return false;
    }
    
    try {
      // In a real implementation, we would validate the session
      // For now, we'll assume any non-empty session string is valid
      const isValid = !!this.sessionString && this.sessionString.length > 10;
      
      if (isValid) {
        this.authState = 'authenticated';
      }
      
      return isValid;
    } catch (error) {
      console.error("Error checking authentication status:", error);
      this.authState = 'error';
      return false;
    }
  }
  
  /**
   * Make an HTTP request to the Telegram API
   */
  protected async makeApiRequest(
    method: string, 
    params: Record<string, any> = {}, 
    apiUrl: string = "https://api.telegram.org"
  ): Promise<any> {
    try {
      const url = `${apiUrl}/api/${method}`;
      
      // Add common parameters
      const requestParams = {
        ...params,
        api_id: this.apiId,
        api_hash: this.apiHash,
      };
      
      if (this.sessionString) {
        requestParams.session = this.sessionString;
      }
      
      console.log(`Making API request to ${method}`, JSON.stringify(requestParams, null, 2));
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestParams),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Telegram API error (${response.status}): ${errorText}`);
      }
      
      const data = await response.json();
      
      console.log(`API response from ${method}:`, JSON.stringify(data, null, 2));
      
      return data;
    } catch (error) {
      console.error(`Error in API request to ${method}:`, error);
      throw error;
    }
  }
}
