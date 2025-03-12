
// Enhanced logging utilities for the Telegram connector

/**
 * Logs environment information for debugging purposes
 */
export function logEnvironmentInfo(): void {
  console.log("Environment information:");
  console.log(`Deno version: ${Deno.version.deno}`);
  console.log(`V8 version: ${Deno.version.v8}`);
  console.log(`TypeScript version: ${Deno.version.typescript}`);
}

/**
 * Logs Supabase configuration information
 */
export function logSupabaseConfig(supabaseUrl: string, supabaseKey: string): void {
  console.log("Supabase configuration:", {
    hasUrl: !!supabaseUrl, 
    hasKey: !!supabaseKey,
    urlLength: supabaseUrl?.length || 0,
    keyLength: supabaseKey?.length || 0
  });
}

/**
 * Logs request information
 */
export function logRequestInfo(req: Request): void {
  console.log("⭐⭐⭐ Telegram connector function called ⭐⭐⭐", {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
  });
}

/**
 * Safely logs request body by masking sensitive data
 */
export function logRequestBody(body: any): void {
  console.log("⭐ PARSED REQUEST BODY ⭐", {
    ...body,
    apiHash: body.apiHash ? "***********" : undefined,
    verificationCode: body.verificationCode ? "******" : undefined,
  });
}

/**
 * Logs completion of function execution with timing
 */
export function logExecutionComplete(startTime: number): void {
  const executionTime = Date.now() - startTime;
  console.log(`✅ Function execution completed in ${executionTime}ms`);
}

/**
 * Enhanced connection status logging
 */
export function logConnectionStatus(success: boolean, details: any): void {
  if (success) {
    console.log("🟢 TELEGRAM API CONNECTION SUCCESSFUL 🟢", {
      timestamp: new Date().toISOString(),
      details
    });
  } else {
    console.log("🔴 TELEGRAM API CONNECTION FAILED 🔴", {
      timestamp: new Date().toISOString(),
      details
    });
  }
}

/**
 * Log operation start with clear visual separator
 */
export function logOperationStart(operation: string): void {
  console.log("\n==================================================");
  console.log(`🚀 STARTING OPERATION: ${operation.toUpperCase()} 🚀`);
  console.log("==================================================\n");
}
