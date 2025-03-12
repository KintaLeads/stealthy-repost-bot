
// Enhanced logging utilities for the Telegram connector

/**
 * Logs environment information for debugging purposes
 */
export function logEnvironmentInfo(): void {
  console.log("🔧 Environment information:");
  console.log(`  Deno version: ${Deno.version.deno}`);
  console.log(`  V8 version: ${Deno.version.v8}`);
  console.log(`  TypeScript version: ${Deno.version.typescript}`);
}

/**
 * Logs Supabase configuration information
 */
export function logSupabaseConfig(supabaseUrl: string, supabaseKey: string): void {
  console.log("📦 Supabase configuration:", {
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
  console.log("📥 Telegram connector request:", {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
  });
}

/**
 * Safely logs request body by masking sensitive data
 */
export function logRequestBody(body: any): void {
  console.log("📋 Request body:", {
    ...body,
    apiHash: body.apiHash ? "[REDACTED]" : undefined,
    verificationCode: body.verificationCode ? "[REDACTED]" : undefined,
    sessionString: body.sessionString ? `[${body.sessionString.length} chars]` : undefined
  });
}

/**
 * Logs completion of function execution with timing
 */
export function logExecutionComplete(startTime: number): void {
  const executionTime = Date.now() - startTime;
  console.log(`✅ Function completed in ${executionTime}ms`);
}

/**
 * Logs the start of an operation
 */
export function logOperationStart(operation: string): void {
  console.log(`🔄 Starting operation: ${operation}`);
}

/**
 * Logs connection status details
 */
export function logConnectionStatus(success: boolean, details: Record<string, any> = {}): void {
  if (success) {
    console.log("🟢 Connection successful:", details);
  } else {
    console.log("🔴 Connection failed:", details);
  }
}
