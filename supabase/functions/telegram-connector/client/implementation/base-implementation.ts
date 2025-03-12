
// Base implementation class for Telegram client
import { TelegramClientInterface, AuthState } from "../types.ts";
import { ValidationClient } from "../validation-client.ts";

export abstract class BaseTelegramImplementation implements Partial<TelegramClientInterface> {
  protected apiId: string;
  protected apiHash: string;
  protected phoneNumber: string;
  protected accountId: string;
  protected sessionString: string;
  protected validationClient: ValidationClient;

  constructor(apiId: string, apiHash: string, phoneNumber: string, accountId: string, sessionString: string = "") {
    // Enhanced validation to catch issues early
    if (!apiId || apiId === "undefined" || apiId === "null" || apiId.trim() === "") {
      console.error("Invalid API ID provided in TelegramClientImplementation constructor:", apiId);
      throw new Error("API ID cannot be empty or undefined");
    }
    
    if (!apiHash || apiHash === "undefined" || apiHash === "null" || apiHash.trim() === "") {
      console.error("Invalid API Hash provided in TelegramClientImplementation constructor");
      throw new Error("API Hash cannot be empty or undefined");
    }
    
    // Store the trimmed values to prevent whitespace issues
    this.apiId = apiId.trim();
    this.apiHash = apiHash.trim();
    this.phoneNumber = phoneNumber;
    this.accountId = accountId;
    this.sessionString = sessionString;
    
    console.log("Creating BaseTelegramImplementation");
    console.log(`API ID: ${this.apiId}, API Hash: ${this.apiHash.substring(0, 3)}..., Phone: ${this.phoneNumber ? this.phoneNumber.substring(0, 4) + '****' : 'Not provided'}`);
    
    // Add numeric validation for API ID
    const numApiId = Number(this.apiId);
    if (isNaN(numApiId) || numApiId <= 0) {
      console.error(`API ID is not a valid number: ${this.apiId}`);
      throw new Error(`API ID must be a positive number, got: ${this.apiId}`);
    }
    
    // Initialize validation client
    this.validationClient = new ValidationClient(this.apiId, this.apiHash, this.phoneNumber, this.accountId, this.sessionString);
  }
  
  // Get API ID
  getApiId(): string {
    return this.apiId;
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
    console.log("Validating credentials with MTProto");
    return this.validationClient.validateCredentials();
  }
  
  // Clean up resources - abstract method to be implemented by subclasses
  abstract disconnect(): Promise<void>;
}
