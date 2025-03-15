/**
 * Authentication-related MTProto methods
 */
import { TelegramClient } from "https://esm.sh/telegram@2.19.10";

/**
 * Handle auth.checkPhone request
 */
export async function handleCheckPhone(client: TelegramClient, phone: string): Promise<any> {
  console.log(`Checking phone ${phone}...`);
  
  // Validate phone number format
  if (!phone || !/^\+[1-9]\d{7,14}$/.test(phone)) {
    console.error("Invalid phone number format:", phone);
    return { error: { code: 400, message: "Invalid phone number format" } };
  }
  
  try {
    // Make actual API call to Telegram using the GramJS client
    const result = await client.invoke({
      _: "auth.checkPhone",
      phone_number: phone.replace('+', '')
    });
    
    console.log("Phone check result:", result);
    return result;
  } catch (error) {
    console.error("Error checking phone:", error);
    throw error;
  }
}

/**
 * Handle auth.sendCode request
 */
export async function handleSendCode(
  client: TelegramClient, 
  phone: string, 
  apiId: number, 
  apiHash: string
): Promise<{ result: any, phoneCodeHash: string | null }> {
  console.log(`Sending code to ${phone}...`);
  
  // Validate phone number format
  if (!phone || !/^\+[1-9]\d{7,14}$/.test(phone)) {
    console.error("Invalid phone number format:", phone);
    return { 
      result: { error: { code: 400, message: "Invalid phone number format" } },
      phoneCodeHash: null
    };
  }
  
  try {
    // Make actual API call to Telegram using the GramJS client
    const result = await client.invoke({
      _: "auth.sendCode",
      phone_number: phone.replace('+', ''),
      api_id: apiId,
      api_hash: apiHash,
      settings: {
        _: "codeSettings",
        allow_flashcall: false,
        current_number: true,
        allow_app_hash: true,
      }
    });
    
    console.log("Send code result:", result);
    
    return {
      result: {
        type: result.type,
        phone_code_hash: result.phone_code_hash,
        timeout: result.timeout || 120
      },
      phoneCodeHash: result.phone_code_hash
    };
  } catch (error) {
    console.error("Error sending code:", error);
    throw error;
  }
}

/**
 * Handle auth.signIn request
 */
export async function handleSignIn(
  client: TelegramClient, 
  phone: string, 
  phoneCodeHash: string, 
  phoneCode: string
): Promise<any> {
  console.log(`Signing in ${phone} with code ${phoneCode} and hash ${phoneCodeHash}...`);
  
  // Validate inputs
  if (!phone || !phoneCodeHash || !phoneCode) {
    console.error("Missing required parameters for sign in");
    return { error: { code: 400, message: "Missing required parameters" } };
  }
  
  try {
    // Make actual API call to Telegram using the GramJS client
    const result = await client.invoke({
      _: "auth.signIn",
      phone_number: phone.replace('+', ''),
      phone_code_hash: phoneCodeHash,
      phone_code: phoneCode
    });
    
    console.log("Sign in result:", result);
    return result;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
}

/**
 * Handle users.getMe request
 */
export async function handleGetMe(client: TelegramClient): Promise<any> {
  console.log("Getting user information...");
  
  try {
    // Make actual API call to Telegram using the GramJS client
    const result = await client.invoke({
      _: "users.getFullUser",
      id: {
        _: "inputUserSelf"
      }
    });
    
    console.log("Get me result:", result);
    return result;
  } catch (error) {
    console.error("Error getting user info:", error);
    throw error;
  }
}
