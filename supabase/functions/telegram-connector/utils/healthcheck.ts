
import { corsHeaders } from "../../_shared/cors.ts";

interface HealthCheckResponse {
  status: string;
  timestamp: number;
  message: string;
  serviceInfo: {
    name: string;
    version: string;
    environment: string;
  };
  denoInfo: {
    version: string;
    v8: string;
    typescript: string;
  };
}

export function handleHealthcheck(headers: Record<string, string>): Response {
  console.log("🏥 Handling healthcheck request");
  
  const response: HealthCheckResponse = {
    status: "ok",
    timestamp: Date.now(),
    message: "Telegram connector service is running",
    serviceInfo: {
      name: "telegram-connector",
      version: "1.0.0",
      environment: Deno.env.get("ENVIRONMENT") || "development"
    },
    denoInfo: {
      version: Deno.version.deno,
      v8: Deno.version.v8,
      typescript: Deno.version.typescript
    }
  };
  
  console.log("Healthcheck response:", response);
  
  return new Response(
    JSON.stringify(response),
    { 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200
    }
  );
}
