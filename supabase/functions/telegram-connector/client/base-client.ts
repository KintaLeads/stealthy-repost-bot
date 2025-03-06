
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
   * This method supports both Bot API and MTProto API calls through proper URL formatting
   */
  protected async makeApiRequest(
    method: string, 
    params: Record<string, any> = {}, 
    apiUrl: string = "https://api.telegram.org"
  ): Promise<any> {
    try {
      // Determine if this is a bot API request or MTProto request
      // MTProto endpoints typically include the "auth." prefix
      const isMTProto = method.startsWith('auth.') || 
                        method.startsWith('account.') || 
                        method.startsWith('messages.');
      
      let url: string;
      let requestBody: Record<string, any>;
      
      if (isMTProto) {
        // For MTProto API (user authentication)
        // We'll use a different approach - simulating TDLib style requests for now
        url = `${apiUrl}/mtprotoapi`;
        requestBody = {
          ...params,
          method,
          api_id: this.apiId,
          api_hash: this.apiHash,
          phone_number: this.phoneNumber
        };
        
        if (this.sessionString) {
          requestBody.session = this.sessionString;
        }
      } else {
        // For Bot API
        url = `${apiUrl}/${method}`;
        requestBody = {
          ...params
        };
      }
      
      console.log(`Making API request to ${url}`, {
        method: isMTProto ? "POST (MTProto)" : "POST (Bot API)",
        params: requestBody
      });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      // First check if we have a successful HTTP response
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Telegram API error (${response.status}): ${errorText}`);
      }
      
      // Then parse the response JSON
      const data = await response.json();
      
      console.log(`API response from ${method}:`, data);
      
      // For Bot API, check the 'ok' field
      if (!isMTProto && data.ok === false) {
        throw new Error(`Telegram API error: ${data.description}`);
      }
      
      // Return the appropriate result
      return isMTProto ? data : data.result;
    } catch (error) {
      console.error(`Error in API request to ${method}:`, error);
      throw error;
    }
  }
}
