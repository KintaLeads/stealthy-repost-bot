
import { ApiAccount } from "@/types/channels";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { getStoredSession, storeSession } from "./sessionManager";

// Create a console debugger component to display all logs
export class ConsoleDebugger {
  private static instance: ConsoleDebugger;
  private logs: Array<{
    level: 'info' | 'warn' | 'error',
    timestamp: Date,
    message: string,
    data?: any
  }> = [];
  
  private constructor() {
    // Private constructor to enforce singleton pattern
    this.hijackConsole();
  }
  
  public static getInstance(): ConsoleDebugger {
    if (!ConsoleDebugger.instance) {
      ConsoleDebugger.instance = new ConsoleDebugger();
    }
    return ConsoleDebugger.instance;
  }
  
  private hijackConsole() {
    // Store the original console methods
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    
    // Override the console methods to capture logs
    console.log = (...args: any[]) => {
      // Call the original method
      originalLog.apply(console, args);
      
      // Add to our logs
      this.logs.push({
        level: 'info',
        timestamp: new Date(),
        message: args[0],
        data: args.length > 1 ? args.slice(1) : undefined
      });
    };
    
    console.warn = (...args: any[]) => {
      // Call the original method
      originalWarn.apply(console, args);
      
      // Add to our logs
      this.logs.push({
        level: 'warn',
        timestamp: new Date(),
        message: args[0],
        data: args.length > 1 ? args.slice(1) : undefined
      });
    };
    
    console.error = (...args: any[]) => {
      // Call the original method
      originalError.apply(console, args);
      
      // Add to our logs
      this.logs.push({
        level: 'error',
        timestamp: new Date(),
        message: args[0],
        data: args.length > 1 ? args.slice(1) : undefined
      });
    };
  }
  
  public getLogs() {
    return [...this.logs];
  }
  
  public clearLogs() {
    this.logs = [];
  }
}

// Initialize the console debugger
export const consoleLogger = ConsoleDebugger.getInstance();

/**
 * Validate Telegram API credentials without creating an account
 */
export const validateTelegramCredentials = async (account: ApiAccount): Promise<{
  success: boolean,
  error?: string
}> => {
  try {
    console.log(`=== VALIDATING TELEGRAM CREDENTIALS ===`);
    console.log(`Account: ${account.nickname} (${account.phoneNumber})`);
    console.log(`API ID: ${account.apiKey}`);
    
    // Check if the inputs match the expected formats before sending
    const apiId = parseInt(account.apiKey, 10);
    if (isNaN(apiId)) {
      console.error("Invalid API ID format:", account.apiKey);
      return { 
        success: false, 
        error: "API ID must be a valid integer. Please check your Telegram API credentials." 
      };
    }
    
    // Check API Hash format (usually 32 hex characters)
    if (!account.apiHash || account.apiHash.length !== 32 || !/^[a-f0-9]+$/i.test(account.apiHash)) {
      console.error("Invalid API Hash format:", account.apiHash);
      return { 
        success: false, 
        error: "API Hash appears to be invalid. It should be a 32-character hexadecimal string." 
      };
    }
    
    // Check phone number format
    if (!account.phoneNumber || !account.phoneNumber.startsWith('+')) {
      console.error("Invalid phone number format:", account.phoneNumber);
      return { 
        success: false, 
        error: "Phone number must be in international format starting with a + sign (e.g., +12345678901)." 
      };
    }
    
    // Try to make a connection to the Supabase function
    try {
      console.log("Checking Edge Function deployment status...");
      console.log("Calling Supabase function 'telegram-connector' for validation...");
      
      // Call the Supabase function to validate credentials without storing
      const { data, error } = await supabase.functions.invoke('telegram-connector', {
        body: {
          operation: 'validate',
          apiId: account.apiKey,
          apiHash: account.apiHash,
          phoneNumber: account.phoneNumber,
          accountId: 'temp-validation' // We don't have an account ID yet
        }
      });
      
      console.log("Telegram credentials validation response:", data);
      
      if (error) {
        console.error('Error validating Telegram credentials:', error);
        
        // More descriptive error handling for different error scenarios
        if (error.message) {
          if (error.message.includes('Failed to fetch')) {
            console.error("Network error when connecting to Edge Function");
            return { 
              success: false, 
              error: "Network error: Could not connect to the Edge Function. This could be because: 1) The Edge Function is not deployed yet, 2) There's an internet connectivity issue, or 3) The Edge Function has an error. Please check your Supabase Edge Functions dashboard." 
            };
          }
          
          if (error.message.includes('not found') || error.message.includes('404')) {
            console.error("Edge Function not found or not deployed");
            return { 
              success: false, 
              error: "Edge Function 'telegram-connector' not found. Please make sure the Edge Function is deployed correctly in your Supabase project." 
            };
          }
          
          if (error.message.includes('timed out')) {
            console.error("Edge Function execution timed out");
            return { 
              success: false, 
              error: "Edge Function execution timed out. This might indicate that the Telegram API is slow to respond or there's an issue with your credentials." 
            };
          }
        }
        
        return { success: false, error: error.message || "Unknown error from Edge Function" };
      }
      
      if (data?.error) {
        console.error('Error in Telegram validation:', data.error);
        
        // Check for known Telegram API errors
        if (data.error.includes('API_ID_INVALID')) {
          return { success: false, error: "Invalid API ID. Please check your Telegram API credentials." };
        }
        
        if (data.error.includes('API_HASH_INVALID')) {
          return { success: false, error: "Invalid API Hash. Please check your Telegram API credentials." };
        }
        
        if (data.error.includes('PHONE_NUMBER_INVALID')) {
          return { success: false, error: "Invalid phone number format. Please use international format with country code." };
        }
        
        if (data.error.includes('PHONE_NUMBER_BANNED')) {
          return { success: false, error: "This phone number has been banned from Telegram." };
        }
        
        if (data.error.includes('PHONE_CODE_INVALID') || data.error.includes('PHONE_CODE_EXPIRED')) {
          return { success: false, error: "Invalid or expired verification code." };
        }
        
        if (data.error.includes('VERSION_OUTDATED')) {
          return { success: false, error: "Telegram client version is outdated. Please check the Edge Function logs for details." };
        }
        
        return { success: false, error: data.error };
      }
      
      if (data?.success) {
        console.log("Telegram credentials validated successfully");
        return { success: true };
      }
      
      console.warn("Unexpected response from Telegram connector:", data);
      return { success: false, error: "Unknown error validating Telegram credentials" };
      
    } catch (fetchError) {
      console.error('Error making request to Telegram connector:', fetchError);
      // Handle specific network errors
      if (fetchError.message) {
        if (fetchError.message.includes('Failed to fetch')) {
          return { 
            success: false, 
            error: "Network error: Failed to connect to the Edge Function. Please verify that your Supabase project is properly configured and the function is deployed." 
          };
        }
        
        if (fetchError.message.includes('CORS')) {
          return { 
            success: false, 
            error: "CORS error: The Edge Function is not properly configured to allow requests from this domain." 
          };
        }
      }
      return { success: false, error: fetchError.message || "Failed to connect to validation service" };
    }
  } catch (error) {
    console.error('Exception validating Telegram credentials:', error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
};

/**
 * Connect to Telegram API using the provided account credentials
 */
export const connectToTelegram = async (account: ApiAccount): Promise<{
  success: boolean, 
  codeNeeded?: boolean, 
  phoneCodeHash?: string,
  error?: string
}> => {
  try {
    console.log(`=== CONNECTING TO TELEGRAM ===`);
    console.log(`Account: ${account.nickname} (${account.phoneNumber})`);
    console.log(`API ID: ${account.apiKey}`);
    console.log(`Account ID: ${account.id}`);
    
    // Check if we have a stored session for this account
    const sessionString = getStoredSession(account.id);
    
    // Prepare the headers
    const headers: Record<string, string> = {};
    if (sessionString) {
      headers['X-Telegram-Session'] = sessionString;
      console.log(`Found stored session for account: ${account.nickname}, using it`);
      console.log(`Session string length: ${sessionString.length}`);
    } else {
      console.log(`No stored session found for account: ${account.nickname}, will need to authenticate`);
    }
    
    console.log(`Checking Edge Function status...`);
    console.log(`Calling Supabase function 'telegram-connector'...`);
    
    // Call the Supabase function
    const { data, error } = await supabase.functions.invoke('telegram-connector', {
      body: {
        operation: 'connect',
        apiId: account.apiKey,
        apiHash: account.apiHash,
        phoneNumber: account.phoneNumber,
        accountId: account.id
      },
      headers
    });
    
    console.log("Telegram connector response:", data);
    
    if (error) {
      console.error('Error connecting to Telegram:', error);
      
      // Enhanced error handling for different error scenarios
      if (error.message) {
        if (error.message.includes('Failed to fetch')) {
          toast({
            title: "Connection Failed",
            description: "Network error: Could not connect to the Edge Function. Please check if the function is deployed.",
            variant: "destructive",
          });
          return { 
            success: false, 
            error: "Network error: Could not connect to the Edge Function. Please check if the function is deployed." 
          };
        }
        
        if (error.message.includes('not found') || error.message.includes('404')) {
          toast({
            title: "Connection Failed",
            description: "Edge Function 'telegram-connector' not found. Please check your Supabase project.",
            variant: "destructive",
          });
          return { 
            success: false, 
            error: "Edge Function 'telegram-connector' not found. Please check your Supabase project." 
          };
        }
        
        if (error.message.includes('timed out')) {
          toast({
            title: "Connection Failed",
            description: "Edge Function execution timed out. This might indicate slow API response.",
            variant: "destructive",
          });
          return { 
            success: false, 
            error: "Edge Function execution timed out. This might indicate slow API response." 
          };
        }
      }
      
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
    
    if (data?.error) {
      console.error('Error in Telegram connector:', data.error);
      
      // Check for known Telegram API errors
      let errorMessage = data.error;
      if (data.error.includes('API_ID_INVALID') || data.error.includes('API_HASH_INVALID')) {
        errorMessage = "Invalid API credentials. Please check your Telegram API ID and Hash.";
      } else if (data.error.includes('PHONE_NUMBER_INVALID')) {
        errorMessage = "Invalid phone number format. Please use international format with country code.";
      } else if (data.error.includes('PHONE_NUMBER_BANNED')) {
        errorMessage = "This phone number has been banned from Telegram.";
      } else if (data.error.includes('AUTH_KEY_UNREGISTERED')) {
        errorMessage = "Authentication failed. The provided session is no longer valid.";
      } else if (data.error.includes('VERSION_OUTDATED')) {
        errorMessage = "Telegram client version is outdated. Please check the Edge Function logs.";
      } else if (data.error.includes('FLOOD_WAIT')) {
        // Extract wait time if available
        const waitMatch = data.error.match(/FLOOD_WAIT_(\d+)/);
        const waitTime = waitMatch ? parseInt(waitMatch[1], 10) : null;
        errorMessage = waitTime 
          ? `Too many requests. Please wait ${waitTime} seconds before trying again.` 
          : "Too many requests. Please wait before trying again.";
      }
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
    
    // Check if code verification is needed
    if (data?.codeNeeded) {
      console.log("Verification code needed for account:", account.nickname, "phoneCodeHash:", data.phoneCodeHash);
      toast({
        title: "Verification Required",
        description: "Please enter the verification code sent to your phone",
      });
      return { 
        success: true, 
        codeNeeded: true, 
        phoneCodeHash: data.phoneCodeHash 
      };
    }
    
    if (data?.success && data?.sessionString) {
      // Store the session for this account
      console.log("Successfully connected with account:", account.nickname);
      console.log("Session string length:", data.sessionString.length);
      storeSession(account.id, data.sessionString);
      toast({
        title: "Connected",
        description: "Successfully connected to Telegram API",
      });
      return { success: true };
    }
    
    console.warn("Unexpected response from Telegram connector:", data);
    toast({
      title: "Connection Failed",
      description: "Received unexpected response from Telegram connector",
      variant: "destructive",
    });
    return { success: false, error: "Unknown error connecting to Telegram" };
  } catch (error) {
    console.error('Exception connecting to Telegram:', error);
    toast({
      title: "Connection Failed",
      description: error instanceof Error ? error.message : "An unknown error occurred",
      variant: "destructive",
    });
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
};

/**
 * Verify the Telegram code sent to the user's phone
 */
export const verifyTelegramCode = async (account: ApiAccount, code: string): Promise<boolean> => {
  try {
    console.log(`=== VERIFYING TELEGRAM CODE ===`);
    console.log(`Account: ${account.nickname} (${account.phoneNumber})`);
    console.log(`Code: ${code}`);
    
    const { data, error } = await supabase.functions.invoke('telegram-connector', {
      body: {
        operation: 'connect',
        apiId: account.apiKey,
        apiHash: account.apiHash,
        phoneNumber: account.phoneNumber,
        accountId: account.id,
        verificationCode: code
      }
    });
    
    console.log("Verification response:", data);
    
    if (error) {
      console.error('Error verifying code:', error);
      
      // Enhanced error handling
      let errorMessage = error.message;
      if (error.message && error.message.includes('Failed to fetch')) {
        errorMessage = "Network error: Could not connect to the Edge Function. Please check if the function is deployed.";
      }
      
      toast({
        title: "Verification Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
    
    if (data?.error) {
      console.error('Error in Telegram verification:', data.error);
      
      // Check for known Telegram API errors
      let errorMessage = data.error;
      if (data.error.includes('PHONE_CODE_INVALID')) {
        errorMessage = "Invalid verification code. Please check and try again.";
      } else if (data.error.includes('PHONE_CODE_EXPIRED')) {
        errorMessage = "Verification code has expired. Please request a new code.";
      } else if (data.error.includes('SESSION_PASSWORD_NEEDED')) {
        errorMessage = "Two-factor authentication is enabled. Please use another authentication method.";
      }
      
      toast({
        title: "Verification Failed",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
    
    if (data?.success && data?.sessionString) {
      // Store the session for this account
      console.log("Successfully verified and authenticated with account:", account.nickname);
      console.log("Session string length:", data.sessionString.length);
      storeSession(account.id, data.sessionString);
      toast({
        title: "Verified",
        description: "Successfully authenticated with Telegram",
      });
      return true;
    }
    
    console.warn("Unexpected response from Telegram verification:", data);
    toast({
      title: "Verification Failed",
      description: "Received unexpected response from Telegram connector",
      variant: "destructive",
    });
    return false;
  } catch (error) {
    console.error('Exception verifying Telegram code:', error);
    toast({
      title: "Verification Failed",
      description: error instanceof Error ? error.message : "An unknown error occurred",
      variant: "destructive",
    });
    return false;
  }
};
