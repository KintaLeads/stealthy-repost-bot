
// Connect to telegram and handle verification
import { corsHeaders } from "../../_shared/cors.ts";
import { createTelegramClient, TelegramClientInterface } from "../client/index.ts";
import { handleCodeVerification, buildVerificationSuccessResponse, buildVerificationErrorResponse } from "./auth/codeVerification.ts";
import { handleInitialConnection, buildCodeRequestedResponse, buildAuthenticatedResponse, buildConnectionErrorResponse } from "./auth/initialConnection.ts";
import { createOperationErrorResponse, validateClientSetup } from "./auth/errorHandler.ts";

export async function handleConnect(
  client: TelegramClientInterface, 
  corsHeaders: Record<string, string>,
  options: { verificationCode?: string, phone_code_hash?: string, debug?: boolean }
): Promise<Response> {
  const debug = options.debug || false;
  console.log(`Handling connect operation, verificationCode provided: ${!!options.verificationCode}, debug: ${debug}`);
  
  try {
    // Validate client setup
    if (!validateClientSetup(client, debug)) {
      return buildConnectionErrorResponse("Invalid client configuration");
    }
    
    // If verification code is provided, verify it
    if (options.verificationCode && options.phone_code_hash) {
      try {
        const verificationResult = await handleCodeVerification(
          client,
          options.verificationCode,
          options.phone_code_hash
        );
        
        if (verificationResult.success) {
          const session = client.getSession();
          return buildVerificationSuccessResponse(
            session,
            client.getAuthState(),
            verificationResult.user
          );
        } else {
          return buildVerificationErrorResponse(verificationResult.error || "Verification failed");
        }
      } catch (verifyError) {
        console.error("Error during verification:", verifyError);
        return createOperationErrorResponse(verifyError, "verificationProcess");
      }
    } 
    // If no verification code is provided, attempt to connect
    else {
      try {
        const connectResult = await handleInitialConnection(client);
        
        if (connectResult.success) {
          if (connectResult.codeNeeded) {
            // In development mode, we might have a test code
            if (connectResult._testCode && debug) {
              console.log(`⚠️ DEVELOPMENT MODE: Verification code is ${connectResult._testCode}`);
            }
            
            console.log("Code sent successfully via MTProto, awaiting verification");
            
            return buildCodeRequestedResponse(
              connectResult.phoneCodeHash as string,
              connectResult._testCode,
              debug
            );
          } else {
            console.log("Already authenticated");
            const session = client.getSession();
            
            return buildAuthenticatedResponse(
              session,
              client.getAuthState(),
              connectResult.user
            );
          }
        } else {
          // Enhanced error information for connection failures
          console.error("Connection failed:", connectResult.error);
          return buildConnectionErrorResponse(
            connectResult.error || "Failed to connect to Telegram",
            connectResult.details
          );
        }
      } catch (connectError) {
        return createOperationErrorResponse(connectError, "connectionProcess");
      }
    }
  } catch (error) {
    return createOperationErrorResponse(error, "connectOperation");
  }
}
