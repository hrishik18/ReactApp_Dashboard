// Webhook Request interface - matches Azure Blob Storage structure
export interface WebhookRequest {
  id: string;                              // Unique request ID (GUID)
  receivedAt: string;                      // ISO 8601 timestamp
  method: string;                          // HTTP method (GET, POST, PUT, PATCH, DELETE)
  path: string;                            // Request path
  headers: Record<string, string>;         // All HTTP headers
  queryParameters: Record<string, string>; // URL query parameters
  rawBody: string;                         // Raw request body
  contentType: string;                     // Content-Type header value
  sourceIp: string;                        // Client IP address
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface WebhookListResponse extends PaginatedResponse<WebhookRequest> {}

export interface DatesResponse {
  dates: string[];
}

export interface WebhookStats {
  total: number;
  byMethod: Record<string, number>;
  byDate: Record<string, number>;
}

// Query parameters for fetching webhooks
export interface WebhookQueryParams {
  date?: string;
  page?: number;
  limit?: number;
  method?: string;
  sourceIp?: string;
  search?: string;
  conversationId?: string;
}

// HTTP Methods enum for type safety
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
