import { 
  BlobServiceClient, 
  ContainerClient,
  type BlobItem 
} from '@azure/storage-blob';

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const containerName = 'webhook-requests';

let containerClient: ContainerClient | null = null;

function getContainerClient(): ContainerClient {
  if (!containerClient) {
    if (!connectionString) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING is not configured');
    }
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    containerClient = blobServiceClient.getContainerClient(containerName);
  }
  return containerClient;
}

export interface WebhookRequest {
  id: string;
  receivedAt: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  queryParameters: Record<string, string>;
  rawBody: string;
  contentType: string;
  sourceIp: string;
}

// Interface for raw blob data (PascalCase from Azure)
interface RawWebhookRequest {
  Id: string;
  ReceivedAt: string;
  Method: string;
  Path: string;
  Headers: Record<string, string>;
  QueryParameters: Record<string, string>;
  RawBody: string;
  ContentType: string;
  SourceIp: string;
}

// Transform PascalCase to camelCase
function transformWebhook(raw: RawWebhookRequest): WebhookRequest {
  return {
    id: raw.Id,
    receivedAt: raw.ReceivedAt,
    method: raw.Method,
    path: raw.Path,
    headers: raw.Headers || {},
    queryParameters: raw.QueryParameters || {},
    rawBody: raw.RawBody || '',
    contentType: raw.ContentType || '',
    sourceIp: raw.SourceIp || '',
  };
}

export interface ListWebhooksParams {
  date?: string;
  page?: number;
  limit?: number;
  method?: string;
  sourceIp?: string;
  search?: string;
  conversationId?: string;
}

export interface ListWebhooksResult {
  data: WebhookRequest[];
  total: number;
  page: number;
  limit: number;
}

/**
 * List all blobs in a specific date folder or all blobs
 */
async function listBlobs(prefix?: string): Promise<BlobItem[]> {
  const container = getContainerClient();
  const blobs: BlobItem[] = [];
  
  const options = prefix ? { prefix } : {};
  
  for await (const blob of container.listBlobsFlat(options)) {
    if (blob.name.endsWith('.json')) {
      blobs.push(blob);
    }
  }
  
  return blobs;
}

/**
 * Read and parse a blob as JSON
 */
async function readBlobAsJson<T>(blobName: string): Promise<T> {
  const container = getContainerClient();
  const blobClient = container.getBlobClient(blobName);
  const downloadResponse = await blobClient.download();
  
  const chunks: Buffer[] = [];
  if (downloadResponse.readableStreamBody) {
    for await (const chunk of downloadResponse.readableStreamBody) {
      chunks.push(Buffer.from(chunk));
    }
  }
  
  const content = Buffer.concat(chunks).toString('utf-8');
  return JSON.parse(content) as T;
}

/**
 * Get list of webhook requests with pagination and filtering
 */
export async function getWebhooks(params: ListWebhooksParams): Promise<ListWebhooksResult> {
  const { date, page = 1, limit = 10, method, sourceIp, search, conversationId } = params;
  
  // Get all blobs (optionally filtered by date prefix)
  const prefix = date ? `${date}/` : undefined;
  const blobs = await listBlobs(prefix);
  
  // Read all webhook data
  const webhooks: WebhookRequest[] = [];
  for (const blob of blobs) {
    try {
      const rawWebhook = await readBlobAsJson<RawWebhookRequest>(blob.name);
      const webhook = transformWebhook(rawWebhook);
      webhooks.push(webhook);
    } catch (error) {
      console.error(`Failed to read blob ${blob.name}:`, error);
    }
  }
  
  // Apply filters
  let filtered = webhooks;
  
  if (method) {
    filtered = filtered.filter(w => w.method.toUpperCase() === method.toUpperCase());
  }
  
  if (sourceIp) {
    filtered = filtered.filter(w => w.sourceIp === sourceIp);
  }
  
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(w => 
      w.id.toLowerCase().includes(searchLower) ||
      w.path.toLowerCase().includes(searchLower) ||
      w.rawBody.toLowerCase().includes(searchLower) ||
      w.contentType.toLowerCase().includes(searchLower) ||
      Object.values(w.headers).some(v => v.toLowerCase().includes(searchLower)) ||
      Object.values(w.queryParameters).some(v => v.toLowerCase().includes(searchLower))
    );
  }
  
  // Filter by conversation ID (extracted from payload)
  if (conversationId) {
    const convIdLower = conversationId.toLowerCase();
    filtered = filtered.filter(w => {
      if (!w.rawBody) return false;
      try {
        const parsed = JSON.parse(w.rawBody);
        const convId = parsed?.conversation?.id;
        return convId && String(convId).toLowerCase().includes(convIdLower);
      } catch {
        return false;
      }
    });
  }
  
  // Sort by receivedAt (newest first)
  filtered.sort((a, b) => 
    new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
  );
  
  // Pagination
  const total = filtered.length;
  const start = (page - 1) * limit;
  const data = filtered.slice(start, start + limit);
  
  return {
    data,
    total,
    page,
    limit,
  };
}

/**
 * Get a single webhook by ID
 */
export async function getWebhookById(id: string): Promise<WebhookRequest | null> {
  const container = getContainerClient();
  
  // Search all date folders for the webhook
  const blobs = await listBlobs();
  
  for (const blob of blobs) {
    if (blob.name.includes(id)) {
      try {
        const rawWebhook = await readBlobAsJson<RawWebhookRequest>(blob.name);
        return transformWebhook(rawWebhook);
      } catch (error) {
        console.error(`Failed to read blob ${blob.name}:`, error);
      }
    }
  }
  
  return null;
}

/**
 * Get list of available dates (folder names)
 */
export async function getAvailableDates(): Promise<string[]> {
  const container = getContainerClient();
  const dates = new Set<string>();
  
  for await (const blob of container.listBlobsFlat()) {
    const parts = blob.name.split('/');
    if (parts.length > 1) {
      dates.add(parts[0]);
    }
  }
  
  return Array.from(dates).sort().reverse();
}

/**
 * Get aggregated statistics
 */
export async function getWebhookStats(): Promise<{
  total: number;
  byMethod: Record<string, number>;
  byDate: Record<string, number>;
}> {
  const blobs = await listBlobs();
  
  const byMethod: Record<string, number> = {};
  const byDate: Record<string, number> = {};
  
  for (const blob of blobs) {
    try {
      const rawWebhook = await readBlobAsJson<RawWebhookRequest>(blob.name);
      const webhook = transformWebhook(rawWebhook);
      
      // Count by method
      const method = webhook.method.toUpperCase();
      byMethod[method] = (byMethod[method] || 0) + 1;
      
      // Count by date
      const date = webhook.receivedAt.split('T')[0];
      byDate[date] = (byDate[date] || 0) + 1;
    } catch (error) {
      console.error(`Failed to read blob ${blob.name}:`, error);
    }
  }
  
  return {
    total: blobs.length,
    byMethod,
    byDate,
  };
}

/**
 * Delete a webhook by ID
 */
export async function deleteWebhook(id: string): Promise<boolean> {
  const container = getContainerClient();
  const blobs = await listBlobs();
  
  for (const blob of blobs) {
    if (blob.name.includes(id)) {
      try {
        const blobClient = container.getBlobClient(blob.name);
        await blobClient.delete();
        return true;
      } catch (error) {
        console.error(`Failed to delete blob ${blob.name}:`, error);
        return false;
      }
    }
  }
  
  return false;
}
