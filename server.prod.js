const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from same directory (for Azure deployment)
app.use(express.static(__dirname));

// Import and use your API routes
try {
  const { BlobServiceClient } = require('@azure/storage-blob');
  
  if (process.env.AZURE_BLOB_CONNECTION_STRING) {
    const blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_BLOB_CONNECTION_STRING
    );
    const containerClient = blobServiceClient.getContainerClient('webhook-requests');

    // Your existing API routes would go here
    app.get('/api/webhooks', async (req, res) => {
      // Copy your webhook API logic from server/index.ts
      res.json({ data: [], total: 0 });
    });

    app.get('/api/dates', async (req, res) => {
      // Copy your dates API logic from server/index.ts  
      res.json({ dates: [] });
    });
  }
} catch (error) {
  console.log('Azure Blob Storage not configured');
}

// Handle React routing - return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});