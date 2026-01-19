import type { 
  WebhookRequest, 
  WebhookListResponse, 
  DatesResponse, 
  WebhookStats,
  WebhookQueryParams 
} from '@/types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

// Helper function to handle API errors
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// Build query string from params object
function buildQueryString(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Fetch paginated list of webhooks with optional filters
 */
export async function getWebhooks(params: WebhookQueryParams = {}): Promise<WebhookListResponse> {
  const queryString = buildQueryString(params as Record<string, string | number | undefined>);
  const response = await fetch(`${API_BASE}/webhooks${queryString}`);
  return handleResponse<WebhookListResponse>(response);
}

/**
 * Fetch a single webhook by ID
 */
export async function getWebhookById(id: string): Promise<WebhookRequest> {
  const response = await fetch(`${API_BASE}/webhooks/${encodeURIComponent(id)}`);
  return handleResponse<WebhookRequest>(response);
}

/**
 * Get list of available dates (folders in blob storage)
 */
export async function getAvailableDates(): Promise<DatesResponse> {
  const response = await fetch(`${API_BASE}/webhooks/dates`);
  return handleResponse<DatesResponse>(response);
}

/**
 * Get aggregated statistics
 */
export async function getWebhookStats(): Promise<WebhookStats> {
  const response = await fetch(`${API_BASE}/webhooks/stats`);
  return handleResponse<WebhookStats>(response);
}

/**
 * Delete a webhook request
 */
export async function deleteWebhook(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/webhooks/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Failed to delete webhook');
  }
}
