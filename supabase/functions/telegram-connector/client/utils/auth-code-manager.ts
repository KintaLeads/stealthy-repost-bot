
/**
 * Manages authentication codes for Telegram
 */
import { MTProto } from "../../proto/index.ts";

/**
 * Request verification code
 */
export async function requestVerificationCode(
  client: MTProto,
  phoneNumber: string,
  apiId: string,
  apiHash: string
): Promise<{ success: boolean; phoneCodeHash?: string; error?: string; _testCode?: string }> {
  console.log(`Requesting verification code for phone: ${phoneNumber}`);
  
  try {
    const sentCode = await client.call('auth.sendCode', {
      phone_number: phoneNumber,
      settings: {
        _: 'codeSettings',
        allow_flashcall: false,
        current_number: true,
        allow_app_hash: true,
      }
    });
    
    if (sentCode.error) {
      console.error("Error sending verification code:", sentCode.error);
      
      return {
        success: false,
        error: `Error sending verification code: ${sentCode.error}`
      };
    }
    
    console.log("Verification code sent successfully");
    
    return {
      success: true,
      phoneCodeHash: sentCode.phone_code_hash,
      _testCode: sentCode._testMode ? sentCode.phone_code : undefined
    };
  } catch (error) {
    console.error("Error requesting verification code:", error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error sending verification code"
    };
  }
}

/**
 * Verify authentication code
 */
export async function verifyAuthenticationCode(
  client: MTProto,
  phoneNumber: string,
  phoneCodeHash: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  console.log(`Verifying authentication code for phone: ${phoneNumber}`);
  
  try {
    const signInResult = await client.call('auth.signIn', {
      phone_number: phoneNumber,
      phone_code_hash: phoneCodeHash,
      phone_code: code
    });
    
    if (signInResult.error) {
      console.error("Error signing in:", signInResult.error);
      
      // Special case for 2FA
      if (signInResult.error === 'SESSION_PASSWORD_NEEDED') {
        return {
          success: false,
          error: "Two-factor authentication is required but not supported in this version."
        };
      }
      
      return {
        success: false,
        error: `Error signing in: ${signInResult.error}`
      };
    }
    
    console.log("Authentication successful!");
    return { success: true };
  } catch (error) {
    console.error("Error verifying code:", error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error verifying code"
    };
  }
}
