// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Method colors for badges
export const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  POST: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  PUT: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  PATCH: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

// Date filter presets
export const DATE_PRESETS = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'Last 7 days', value: 'last7days' },
  { label: 'Last 30 days', value: 'last30days' },
  { label: 'All time', value: 'all' },
] as const;

// Navigation items
export const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/webhooks', label: 'Webhooks', icon: 'Webhook' },
] as const;

// Query keys for React Query
export const QUERY_KEYS = {
  webhooks: 'webhooks',
  webhook: 'webhook',
  stats: 'webhookStats',
  dates: 'webhookDates',
} as const;

// Refresh intervals (in milliseconds)
export const REFRESH_INTERVALS = {
  stats: 60000, // 15 seconds
  webhookList: 3000, // 10 seconds
} as const;
