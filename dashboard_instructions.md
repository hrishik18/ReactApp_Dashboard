# Webhook Dashboard - React App Instructions

## Project Overview

Build a modern React dashboard application to display webhook requests stored in Azure Blob Storage. The dashboard will be hosted on Azure App Service and will provide a clean, professional interface for viewing and analyzing incoming webhook data.

## Technology Stack

- **Frontend Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **UI Framework**: Tailwind CSS + shadcn/ui components
- **State Management**: React Query (TanStack Query) for server state
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **JSON Viewer**: react-json-view-lite or similar
- **Hosting**: Azure App Service (Static Web App or Node.js backend)

## Data Model

The webhook requests are stored as JSON files in Azure Blob Storage with the following structure:

```typescript
interface WebhookRequest {
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
```

**Blob Storage Structure:**
- Container: `webhook-requests`
- Blob naming pattern: `{yyyy-MM-dd}/{request-id}.json`
- Example: `2026-01-16/abc123-def456-ghi789.json`

## Architecture

### Option 1: Full-Stack with Backend API (Recommended)
```
React Frontend → Express.js API → Azure Blob Storage
                      ↓
              Azure App Service
```

### Option 2: Static Frontend with Azure Functions API
```
React Frontend (Static) → Azure Functions API → Azure Blob Storage
```

## Backend API Requirements

Create a Node.js/Express backend with the following endpoints:

### API Endpoints

```typescript
// GET /api/webhooks
// List all webhooks with pagination and filtering
// Query params: date, page, limit, method, sourceIp
// Response: { data: WebhookRequest[], total: number, page: number, limit: number }

// GET /api/webhooks/:id
// Get single webhook by ID
// Response: WebhookRequest

// GET /api/webhooks/dates
// Get list of available dates (folders in blob storage)
// Response: { dates: string[] }

// GET /api/webhooks/stats
// Get aggregated statistics
// Response: { total: number, byMethod: Record<string, number>, byDate: Record<string, number> }

// DELETE /api/webhooks/:id (optional)
// Delete a webhook request
```

### Backend Implementation Notes

```typescript
// Use @azure/storage-blob SDK
import { BlobServiceClient } from '@azure/storage-blob';

// Connection string from environment variable
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = 'webhook-requests';

// List blobs by date prefix for efficient querying
// Parse JSON content from each blob
// Implement server-side pagination and filtering
```

## Frontend Components

### Page Components

1. **DashboardPage** (`/`)
   - Summary statistics cards (total requests, requests today, unique IPs)
   - Recent requests table (last 10)
   - Quick filters by method type
   - Chart showing requests over time (last 7 days)

2. **WebhookListPage** (`/webhooks`)
   - Paginated table of all webhook requests
   - Filters: date range, HTTP method, source IP, search by ID
   - Sortable columns
   - Click row to view details

3. **WebhookDetailPage** (`/webhooks/:id`)
   - Full webhook request details
   - Formatted JSON viewer for body (if JSON content)
   - Collapsible headers section
   - Query parameters display
   - Copy-to-clipboard buttons
   - Raw body view toggle

### Reusable Components

1. **WebhookTable**
   - Columns: ID (truncated), Received At, Method, Path, Source IP, Content Type
   - Method badge with color coding (GET=green, POST=blue, PUT=orange, DELETE=red)
   - Responsive design

2. **MethodBadge**
   - Color-coded badge for HTTP methods
   - Props: method: string

3. **JsonViewer**
   - Syntax-highlighted JSON display
   - Collapsible nodes
   - Copy button

4. **HeadersTable**
   - Two-column table for key-value pairs
   - Used for headers and query parameters

5. **StatsCard**
   - Icon, title, value, optional trend indicator
   - Used on dashboard

6. **DateFilter**
   - Date picker for filtering by date
   - Quick presets: Today, Yesterday, Last 7 days, Last 30 days

7. **SearchInput**
   - Debounced search input
   - Clear button

8. **Pagination**
   - Page numbers, previous/next buttons
   - Items per page selector

9. **LoadingSpinner** / **LoadingSkeleton**
   - Loading states for data fetching

10. **ErrorBoundary** / **ErrorMessage**
    - Error handling and display

## UI/UX Requirements

### Layout
- Responsive sidebar navigation (collapsible on mobile)
- Header with app title and optional user info
- Main content area with proper padding
- Footer with version info (optional)

### Design System
- Clean, professional look
- Light/Dark mode toggle
- Consistent spacing (use Tailwind's spacing scale)
- Card-based layout for content sections

### Color Scheme (Tailwind)
```css
/* Method colors */
GET: bg-green-100 text-green-800
POST: bg-blue-100 text-blue-800
PUT: bg-orange-100 text-orange-800
PATCH: bg-yellow-100 text-yellow-800
DELETE: bg-red-100 text-red-800

/* Status colors */
Success: green-500
Error: red-500
Warning: amber-500
Info: blue-500
```

### Accessibility
- Proper heading hierarchy
- ARIA labels for interactive elements
- Keyboard navigation support
- Focus indicators

## Project Structure

```
webhook-dashboard/
├── public/
├── src/
│   ├── api/
│   │   └── webhookApi.ts          # API client functions
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Layout.tsx
│   │   ├── webhooks/
│   │   │   ├── WebhookTable.tsx
│   │   │   ├── WebhookDetail.tsx
│   │   │   ├── MethodBadge.tsx
│   │   │   ├── HeadersTable.tsx
│   │   │   └── JsonViewer.tsx
│   │   └── common/
│   │       ├── StatsCard.tsx
│   │       ├── DateFilter.tsx
│   │       ├── SearchInput.tsx
│   │       ├── Pagination.tsx
│   │       └── LoadingSpinner.tsx
│   ├── hooks/
│   │   ├── useWebhooks.ts         # React Query hooks
│   │   └── useDebounce.ts
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── WebhookListPage.tsx
│   │   └── WebhookDetailPage.tsx
│   ├── types/
│   │   └── webhook.ts             # TypeScript interfaces
│   ├── utils/
│   │   ├── formatters.ts          # Date, ID formatting
│   │   └── constants.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── server/                        # Backend (if using Option 1)
│   ├── index.ts
│   ├── routes/
│   │   └── webhooks.ts
│   └── services/
│       └── blobStorage.ts
├── .env.example
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

## Environment Variables

```env
# Frontend
VITE_API_BASE_URL=http://localhost:3001/api

# Backend
AZURE_STORAGE_CONNECTION_STRING=your_connection_string_here
PORT=3001
NODE_ENV=development
```

## Key Features to Implement

### Must Have
- [ ] List all webhook requests with pagination
- [ ] View individual webhook details
- [ ] Filter by date
- [ ] Filter by HTTP method
- [ ] Search by request ID
- [ ] Responsive design
- [ ] Loading and error states
- [ ] JSON body formatting/highlighting

### Nice to Have
- [ ] Real-time updates (polling or WebSocket)
- [ ] Export to CSV/JSON
- [ ] Dark mode
- [ ] Request timeline visualization
- [ ] Header search/filter
- [ ] Body content search
- [ ] Webhook comparison view
- [ ] Statistics dashboard with charts
- [ ] Delete webhook functionality
- [ ] Bulk actions

## Azure App Service Deployment

### For Static Web App
1. Build the React app: `npm run build`
2. Deploy the `dist` folder to Azure Static Web Apps
3. Configure Azure Functions for the API

### For App Service (Node.js)
1. Build frontend: `npm run build`
2. Configure Express to serve static files from `dist`
3. Deploy entire project to Azure App Service
4. Set environment variables in App Service Configuration

### Deployment Script Example
```bash
# Build frontend
npm run build

# Deploy to Azure (using Azure CLI)
az webapp up --name webhook-dashboard --resource-group your-rg --runtime "NODE:18-lts"
```

## Sample Code Snippets

### API Client (src/api/webhookApi.ts)
```typescript
const API_BASE = import.meta.env.VITE_API_BASE_URL;

export async function getWebhooks(params: {
  date?: string;
  page?: number;
  limit?: number;
  method?: string;
}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) searchParams.append(key, String(value));
  });
  
  const response = await fetch(`${API_BASE}/webhooks?${searchParams}`);
  if (!response.ok) throw new Error('Failed to fetch webhooks');
  return response.json();
}

export async function getWebhookById(id: string) {
  const response = await fetch(`${API_BASE}/webhooks/${id}`);
  if (!response.ok) throw new Error('Failed to fetch webhook');
  return response.json();
}
```

### React Query Hook (src/hooks/useWebhooks.ts)
```typescript
import { useQuery } from '@tanstack/react-query';
import { getWebhooks, getWebhookById } from '../api/webhookApi';

export function useWebhooks(params: WebhookQueryParams) {
  return useQuery({
    queryKey: ['webhooks', params],
    queryFn: () => getWebhooks(params),
    staleTime: 30000, // 30 seconds
  });
}

export function useWebhook(id: string) {
  return useQuery({
    queryKey: ['webhook', id],
    queryFn: () => getWebhookById(id),
    enabled: !!id,
  });
}
```

### Method Badge Component
```tsx
const methodColors: Record<string, string> = {
  GET: 'bg-green-100 text-green-800',
  POST: 'bg-blue-100 text-blue-800',
  PUT: 'bg-orange-100 text-orange-800',
  PATCH: 'bg-yellow-100 text-yellow-800',
  DELETE: 'bg-red-100 text-red-800',
};

export function MethodBadge({ method }: { method: string }) {
  const colorClass = methodColors[method.toUpperCase()] || 'bg-gray-100 text-gray-800';
  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${colorClass}`}>
      {method.toUpperCase()}
    </span>
  );
}
```

## Testing Requirements

- Unit tests for utility functions
- Component tests with React Testing Library
- API integration tests
- End-to-end tests with Playwright (optional)

## Performance Considerations

1. Implement virtual scrolling for large lists
2. Use React Query for caching and deduplication
3. Lazy load webhook details
4. Compress API responses
5. Use pagination instead of loading all data
6. Implement debouncing for search inputs

## Security Considerations

1. Never expose Azure Storage connection string to frontend
2. Implement proper CORS configuration
3. Add rate limiting to API endpoints
4. Validate and sanitize all inputs
5. Consider adding authentication if needed (Azure AD, etc.)

---

## Getting Started Commands

```bash
# Create new Vite React project
npm create vite@latest webhook-dashboard -- --template react-ts

# Install dependencies
cd webhook-dashboard
npm install @tanstack/react-query react-router-dom date-fns lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install shadcn/ui (follow their setup guide)
npx shadcn-ui@latest init

# For backend
npm install express @azure/storage-blob cors dotenv
npm install -D @types/express @types/cors tsx
```

## Notes for GitHub Copilot

When implementing this project:
1. Start with the TypeScript interfaces and API client
2. Build the layout components first (Sidebar, Header, Layout)
3. Implement the webhook list page with basic functionality
4. Add the detail page
5. Implement filters and pagination
6. Add the dashboard with statistics
7. Polish with loading states, error handling, and responsiveness
8. Set up the backend API to connect to Azure Blob Storage
9. Test thoroughly before deployment
