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

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy using Azure CLI:
   ```bash
   az webapp up --name webhook-dashboard --resource-group your-rg --runtime "NODE:18-lts"
   ```

3. Set environment variables in Azure Portal.

## License

MIT
