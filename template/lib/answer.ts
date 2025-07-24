import { 
  buildApiRequestBody, 
  getApiEndpoint, 
  getApiHeaders, 
  validateApiConfig
} from './api-config';

export interface AnswerRequest {
  namespace: string;
  query: string;
  type?: string;
  top_k?: number;
  aiModel?: string;
  temperature?: number;
  kiosk_mode?: boolean;
  threshold?: number;
  chatHistory?: { role: string; content: string }[];
  headerPrompt?: string;
  footerPrompt?: string;
  [key: string]: unknown; // Allow additional custom fields
}

export interface AnswerResponse {
  answer?: string;
  response?: string;
  [key: string]: unknown;
}

/**
 * Fetch answer using the new API configuration system
 * This function now uses config/api-config.json for all request parameters
 */
export async function fetchAnswer(payload: AnswerRequest): Promise<AnswerResponse> {
  // Validate API configuration first
  const validation = validateApiConfig();
  if (!validation.isValid) {
    console.error('API Configuration errors:', validation.errors);
    throw new Error(`API Configuration invalid: ${validation.errors.join(', ')}`);
  }

  // Prepare overrides from payload (excluding query and chatHistory which are handled separately)
  const { query, chatHistory, ...overrides } = payload;
  
  // Build the complete request body using the configuration
  // This will include all parameters from the payload and handle threshold logic
  const requestBody = buildApiRequestBody(
    query,
    chatHistory || [],
    overrides
  );

  // Get endpoint and headers from configuration
  const endpoint = getApiEndpoint();
  const headers = getApiHeaders();

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
    });
    //console.log(requestBody); // uncomment this to see the request body for debugging

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`API error (${res.status}): ${errorText}`);
    }

    return res.json();
   // console.log(res.json()); // uncomment this to see the response for debugging
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

/**
 * Legacy function for backward compatibility
 * @deprecated Use fetchAnswer instead
 */
export async function fetchAnswerLegacy(payload: AnswerRequest): Promise<AnswerResponse> {
  const res = await fetch("https://api.moorcheh.ai/v1/answer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.NEXT_PUBLIC_MOORCHEH_API_KEY || "",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("API error");
  return res.json();
} 