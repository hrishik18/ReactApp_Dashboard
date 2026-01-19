import express from 'express';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import { BlobServiceClient } from '@azure/storage-blob';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from dist folder (built React app)
const staticPath = path.join(__dirname, 'dist');
console.log('Serving static files from:', staticPath);
app.use(express.static(staticPath));

// ==================== BLOB STORAGE SETUP ====================
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const containerName = 'webhook-requests';
let containerClient = null;

function getContainerClient() {
  if (!containerClient) {
    if (!connectionString) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING is not configured');
    }
    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString);
    containerClient = blobServiceClient.getContainerClient(containerName);
  }
  return containerClient;
}

// Transform PascalCase to camelCase
function transformWebhook(raw) {
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

// List all blobs in a specific date folder or all blobs
async function listBlobs(prefix) {
  const container = getContainerClient();
  const blobs = [];
  const options = prefix ? { prefix } : {};
  
  for await (const blob of container.listBlobsFlat(options)) {
    if (blob.name.endsWith('.json')) {
      blobs.push(blob);
    }
  }
  return blobs;
}

// Read and parse a blob as JSON
async function readBlobAsJson(blobName) {
  const container = getContainerClient();
  const blobClient = container.getBlobClient(blobName);
  const downloadResponse = await blobClient.download();
  
  const chunks = [];
  if (downloadResponse.readableStreamBody) {
    for await (const chunk of downloadResponse.readableStreamBody) {
      chunks.push(Buffer.from(chunk));
    }
  }
  
  const content = Buffer.concat(chunks).toString('utf-8');
  return JSON.parse(content);
}

// ==================== API ROUTES ====================

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/webhooks/dates - Get list of available dates
app.get('/api/webhooks/dates', async (_req, res) => {
  try {
    const container = getContainerClient();
    const dateSet = new Set();
    
    for await (const blob of container.listBlobsFlat()) {
      if (blob.name.endsWith('.json')) {
        const datePart = blob.name.split('/')[0];
        if (datePart) dateSet.add(datePart);
      }
    }
    
    const dates = Array.from(dateSet).sort().reverse();
    res.json({ dates });
  } catch (error) {
    console.error('Error fetching dates:', error);
    res.status(500).json({ error: 'Failed to fetch dates' });
  }
});

// GET /api/webhooks/stats - Get aggregated statistics
app.get('/api/webhooks/stats', async (_req, res) => {
  try {
    const blobs = await listBlobs();
    const methodCounts = {};
    let totalSize = 0;
    
    for (const blob of blobs) {
      try {
        const raw = await readBlobAsJson(blob.name);
        const method = raw.Method || 'UNKNOWN';
        methodCounts[method] = (methodCounts[method] || 0) + 1;
        totalSize += blob.properties?.contentLength || 0;
      } catch (error) {
        console.error(`Failed to read blob ${blob.name}:`, error);
      }
    }
    
    res.json({
      totalRequests: blobs.length,
      methodCounts,
      totalSize,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/webhooks - List all webhooks with pagination and filtering
app.get('/api/webhooks', async (req, res) => {
  try {
    const { date, page = 1, limit = 10, method, sourceIp, search, conversationId } = req.query;
    
    const prefix = date ? `${date}/` : undefined;
    const blobs = await listBlobs(prefix);
    
    const webhooks = [];
    for (const blob of blobs) {
      try {
        const rawWebhook = await readBlobAsJson(blob.name);
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
    
    // Filter by conversation ID
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
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const start = (pageNum - 1) * limitNum;
    const data = filtered.slice(start, start + limitNum);
    
    res.json({ data, total, page: pageNum, limit: limitNum });
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    res.status(500).json({ error: 'Failed to fetch webhooks' });
  }
});

// GET /api/webhooks/:id - Get single webhook by ID
app.get('/api/webhooks/:id(*)', async (req, res) => {
  try {
    const { id } = req.params;
    const container = getContainerClient();
    
    // Try to find the blob by ID
    for await (const blob of container.listBlobsFlat()) {
      if (blob.name.endsWith('.json')) {
        try {
          const raw = await readBlobAsJson(blob.name);
          if (raw.Id === id) {
            res.json(transformWebhook(raw));
            return;
          }
        } catch (error) {
          continue;
        }
      }
    }
    
    res.status(404).json({ error: 'Webhook not found' });
  } catch (error) {
    console.error('Error fetching webhook:', error);
    res.status(500).json({ error: 'Failed to fetch webhook' });
  }
});

// DELETE /api/webhooks/:id - Delete a webhook
app.delete('/api/webhooks/:id(*)', async (req, res) => {
  try {
    const { id } = req.params;
    const container = getContainerClient();
    
    for await (const blob of container.listBlobsFlat()) {
      if (blob.name.endsWith('.json')) {
        try {
          const raw = await readBlobAsJson(blob.name);
          if (raw.Id === id) {
            await container.deleteBlob(blob.name);
            res.status(204).send();
            return;
          }
        } catch (error) {
          continue;
        }
      }
    }
    
    res.status(404).json({ error: 'Webhook not found' });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    res.status(500).json({ error: 'Failed to delete webhook' });
  }
});

// Handle React routing - return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});