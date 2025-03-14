
// Base implementation class for Telegram client
import { TelegramClientInterface, AuthState } from "../types.ts";
import { ValidationClient } from "../validation-client.ts";

export abstract class BaseTelegramImplementation implements Partial<TelegramClientInterface> {
  protected apiId: string | number;
  protected apiHash: string;
  protected phoneNumber: string;
  protected accountId: string;
  protected sessionString: string;
  protected validationClient: ValidationClient;

  constructor(apiId: string | number, apiHash: string, phoneNumber: string, accountId: string, sessionString: string = "") {
    // Log received values
    console.log(`[BASE-IMPLEMENTATION] Constructor received:
      - apiId: ${apiId} (${typeof apiId})
      - apiHash: ${apiHash ? apiHash.substring(0, 3) + '...' : 'undefined'} (${typeof apiHash})
      - phoneNumber: ${phoneNumber ? phoneNumber.substring(0, 4) + '****' : 'none'} (${typeof phoneNumber})
      - accountId: ${accountId} (${typeof accountId})
      - sessionString: ${sessionString ? 'provided' : 'none'} (${typeof sessionString})`);
    
    // Enhanced validation to catch issues early
    if (apiId === undefined || apiId === null) {
      console.error("[BASE-IMPLEMENTATION] Undefined or null API ID provided:", apiId);
      throw new Error("API ID cannot be undefined or null");
    }
    
    if (apiHash === undefined || apiHash === null || apiHash.trim() === "") {
      console.error("[BASE-IMPLEMENTATION] Invalid API Hash provided:", apiHash);
      throw new Error("API Hash cannot be empty, undefined or null");
    }
    
    // Store the original type of apiId (string or number) to maintain type consistency
    // This is important because some libraries expect a string and others expect a number
    this.apiId = apiId; 
    this.apiHash = apiHash.trim();
    this.phoneNumber = phoneNumber;
    this.accountId = accountId;
    this.sessionString = sessionString;
    
    console.log("[BASE-IMPLEMENTATION] Creating BaseTelegramImplementation");
    console.log(`[BASE-IMPLEMENTATION] Values after processing:
      - API ID: ${this.apiId} (${typeof this.apiId})
      - API Hash: ${this.apiHash.substring(0, 3)}... (length: ${this.apiHash.length})
      - Phone: ${this.phoneNumber ? this.phoneNumber.substring(0, 4) + '****' : 'Not provided'}`);
    
    // Add numeric validation for API ID - convert to number temporarily for validation
    const numApiId = typeof this.apiId === 'number' ? this.apiId : parseInt(String(this.apiId), 10);
    if (isNaN(numApiId) || numApiId <= 0) {
      console.error(`[BASE-IMPLEMENTATION] API ID is not a valid number: ${this.apiId}`);
      throw new Error(`API ID must be a positive number, got: ${this.apiId}`);
    }
    
    // Initialize validation client - use the original apiId type (string or number)
    this.validationClient = new ValidationClient(this.apiId, this.apiHash, this.phoneNumber, this.accountId, this.sessionString);
    
    console.log("[BASE-IMPLEMENTATION] BaseTelegramImplementation created successfully");
  }
  
  // Get API ID - maintain original type
  getApiId(): string | number {
    return this.apiId;
  }
  
  // Get API ID as string (for string operations)
  getApiIdString(): string {
    return String(this.apiId);
  }
  
  // Get API ID as number (for numeric operations)
  getApiIdNumber(): number {
    return typeof this.apiId === 'number' ? this.apiId : parseInt(String(this.apiId), 10);
  }
  
  // Get API Hash 
  getApiHash(): string {
    return this.apiHash;
  }
  
  // Get session string
  getSession(): string {
    return this.sessionString;
  }
  
  // Get phone number
  getPhoneNumber(): string {
    return this.phoneNumber;
  }
  
  // Method to validate credentials
  async validateCredentials(): Promise<{ success: boolean; error?: string }> {
    console.log("[BASE-IMPLEMENTATION] Validating credentials with MTProto");
    return this.validationClient.validateCredentials();
  }
  
  // Clean up resources - abstract method to be implemented by subclasses
  abstract disconnect(): Promise<void>;
}
