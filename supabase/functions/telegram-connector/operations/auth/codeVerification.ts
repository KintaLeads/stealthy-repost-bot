
import { corsHeaders } from "../../../_shared/cors.ts";
import { TelegramClientInterface } from "../../client/types.ts";

/**
 * Handles the verification of authentication codes
 */
export async function handleCodeVerification(
  client: TelegramClientInterface,
  verificationCode: string,
  phoneCodeHash: string
): Promise<{
  success: boolean;
  error?: string;
  user?: any;
  session?: string;
}> {
  console.log("Verifying code with phone_code_hash");
  
  try {
    const verificationResult = await client.verifyCode(
      verificationCode, 
      phoneCodeHash
    );
    
    if (verificationResult.success) {
      console.log("Code verification successful");
      return {
        success: true,
        session: client.getSession(),
        user: verificationResult.user
      };
    } else {
      console.error("Code verification failed:", verificationResult.error);
      return {
        success: false,
        error: verificationResult.error || "Failed to verify code"
      };
    }
  } catch (error) {
    console.error("Exception during code verification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error during verification"
    };
  }
}

/**
 * Builds a successful verification response
 */
export function buildVerificationSuccessResponse(
  session: string, 
  authState: string,
  user: any
): Response {
  return new Response(
    JSON.stringify({
      success: true,
      message: "Authentication completed successfully",
      session: session,
      authState: authState,
      user: user
    }),
    { 
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/json",
        "X-Telegram-Session": session,
        "Access-Control-Expose-Headers": "X-Telegram-Session"
      } 
    }
  );
}

/**
 * Builds an error response for failed verification
 */
export function buildVerificationErrorResponse(
  error: string, 
  details?: any
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: error || "Failed to verify code",
      details: details || {
        verificationAttempted: true
      }
    }),
    { 
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" } 
    }
  );
}
