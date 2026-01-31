/**
 * Helicone LLM Observability Configuration
 *
 * Helicone provides automatic cost/latency tracking for all AI calls.
 * Dashboard: https://us.helicone.ai/dashboard
 */

// Helicone gateway URLs for each provider
export const HELICONE_GATEWAYS = {
  anthropic: 'https://anthropic.helicone.ai',
  openai: 'https://oai.helicone.ai/v1',
  google: 'https://gateway.helicone.ai',
} as const;

// Check if Helicone is enabled (has API key)
export function isHeliconeEnabled(): boolean {
  return !!process.env.HELICONE_API_KEY;
}

// Create Helicone auth headers
export function createHeliconeHeaders(options?: {
  sessionId?: string;
  userId?: string;
  metadata?: Record<string, string>;
}): Record<string, string> {
  const apiKey = process.env.HELICONE_API_KEY;
  if (!apiKey) return {};

  const headers: Record<string, string> = {
    'Helicone-Auth': `Bearer ${apiKey}`,
  };

  // Optional: Add session tracking
  if (options?.sessionId) {
    headers['Helicone-Session-Id'] = options.sessionId;
  }

  // Optional: Add user tracking
  if (options?.userId) {
    headers['Helicone-User-Id'] = options.userId;
  }

  // Optional: Add custom metadata
  if (options?.metadata) {
    Object.entries(options.metadata).forEach(([key, value]) => {
      headers[`Helicone-Property-${key}`] = value;
    });
  }

  return headers;
}
