# Webhook Dashboard

A modern React dashboard application to display webhook requests stored in Azure Blob Storage.

## Features

- 📊 Dashboard with statistics and recent requests
- 📋 Paginated webhook list with filtering
- 🔍 Search by ID and filter by method/date
- 📝 Detailed webhook view with formatted JSON
- 🌙 Dark mode support
- 📱 Responsive design

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Backend**: Express.js, Azure Blob Storage SDK

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Azure Storage Account with a `webhook-requests` container

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Azure Storage connection string:
   ```
   AZURE_STORAGE_CONNECTION_STRING=your_connection_string_here
   ```

### Development

Run both frontend and backend:
```bash
npm run dev:all
```

Or run them separately:
```bash
# Frontend only (port 5173)
npm run dev

# Backend only (port 3001)
npm run server
```

### Build

```bash
npm run build
```

## Project Structure

```
├── src/
│   ├── api/           # API client functions
│   ├── components/
│   │   ├── common/    # Reusable UI components
│   │   ├── layout/    # Layout components
│   │   └── webhooks/  # Webhook-specific components
│   ├── hooks/         # Custom React hooks
│   ├── pages/         # Page components
│   ├── types/         # TypeScript interfaces
│   └── utils/         # Utility functions
├── server/            # Express backend
│   ├── routes/        # API routes
│   └── services/      # Azure Blob Storage service
└── ...config files
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/webhooks` | List webhooks (paginated, filterable) |
| `GET /api/webhooks/:id` | Get single webhook |
| `GET /api/webhooks/dates` | Get available dates |
| `GET /api/webhooks/stats` | Get statistics |
| `DELETE /api/webhooks/:id` | Delete webhook |

## Deployment

### Azure App Service


#### Prerequisites
- Azure App Service (Node.js 20 LTS)
- Azure Storage Account with `webhook-requests` container
- GitHub repository connected to App Service for CI/CD

#### Deployment Steps

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Configure GitHub Actions** (automatic deployment on push to main):
   - Connect your GitHub repo to Azure App Service via Deployment Center
   - GitHub Actions workflow will auto-deploy on push

3. **Set Environment Variables** in Azure Portal → App Service → Settings → Environment variables:
   ```
   AZURE_STORAGE_CONNECTION_STRING=<your-storage-connection-string>
   NODE_ENV=production
   ```

4. **Configure Startup Command** in Azure Portal → App Service → Settings → Configuration:
   ```
   node server.prod.js
   ```

#### Manual Deployment (Azure CLI)

```bash
# Login to Azure
az login --use-device-code

# Set subscription
az account set --subscription "<subscription-id>"

# Deploy
az webapp deploy --resource-group "MyLabResourceGroup" --name "catchr" --src-path "." --type "zip"

# Set environment variables
az webapp config appsettings set --resource-group "MyLabResourceGroup" --name "catchr" --settings AZURE_STORAGE_CONNECTION_STRING="<connection-string>"
```

## Files to Exclude from Deployment

The following files/folders are not required in production:
- `azure-logs/` - Local Azure logs
- `dashboard_instructions.md` - Development instructions
- `deploy.zip` - Deployment artifact
- `*.tsbuildinfo` - TypeScript build cache
- `vite.config.d.ts`, `vite.config.js` - Vite build artifacts

## License

MIT
