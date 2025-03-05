/**
 * Network connectivity checker for Telegram API
 * This helps diagnose if the issue is with the network connection
 */

// Check if we can connect to the Supabase API
export const checkSupabaseConnectivity = async (): Promise<boolean> => {
  try {
    console.log("Checking Supabase connectivity...");
    const response = await fetch('https://supabase.co/ping', { 
      method: 'GET',
      mode: 'no-cors' 
    });
    console.log("Supabase connectivity check response:", response.ok);
    return response.ok;
  } catch (error) {
    console.error("Error checking Supabase connectivity:", error);
    return false;
  }
};

// Check if Telegram services are up
export const checkTelegramConnectivity = async (): Promise<boolean> => {
  try {
    console.log("Checking Telegram connectivity...");
    // Using Telegram web as a proxy to check if Telegram services are accessible
    const response = await fetch('https://web.telegram.org/a/', { 
      method: 'GET',
      mode: 'no-cors' 
    });
    console.log("Telegram connectivity check response:", response.ok);
    return response.ok;
  } catch (error) {
    console.error("Error checking Telegram connectivity:", error);
    return false;
  }
};

// Check if Edge Function is deployed
export const checkEdgeFunctionStatus = async (projectId: string, functionName: string): Promise<{
  deployed: boolean;
  error?: string;
}> => {
  try {
    console.log(`Checking Edge Function status for ${functionName}...`);
    const url = `https://${projectId}.supabase.co/functions/v1/${functionName}`;
    
    // Send an OPTIONS request to check if the function exists
    const response = await fetch(url, { 
      method: 'OPTIONS',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Edge Function ${functionName} status:`, response.status);
    
    // 204 means the function is deployed and CORS is configured correctly
    if (response.status === 204) {
      return { deployed: true };
    }
    
    // 404 means the function is not deployed
    if (response.status === 404) {
      return { 
        deployed: false,
        error: `Edge Function ${functionName} is not deployed. Please check your Supabase project.`
      };
    }
    
    // Other status codes might indicate other issues
    return { 
      deployed: false,
      error: `Edge Function ${functionName} returned status ${response.status}. This might indicate a configuration issue.`
    };
  } catch (error) {
    console.error(`Error checking Edge Function ${functionName} status:`, error);
    return { 
      deployed: false,
      error: `Failed to check Edge Function status: ${error.message}`
    };
  }
};

// Run all connectivity checks
export const runConnectivityChecks = async (projectId: string): Promise<{
  supabase: boolean;
  telegram: boolean;
  edgeFunction: {
    deployed: boolean;
    error?: string;
  };
}> => {
  const supabaseConnectivity = await checkSupabaseConnectivity();
  const telegramConnectivity = await checkTelegramConnectivity();
  const edgeFunctionStatus = await checkEdgeFunctionStatus(projectId, 'telegram-connector');
  
  return {
    supabase: supabaseConnectivity,
    telegram: telegramConnectivity,
    edgeFunction: edgeFunctionStatus
  };
};
