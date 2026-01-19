import { useState, useEffect, useMemo, useCallback } from 'react';
import { RefreshCw, Moon, Sun, Webhook, Search, X, Filter, ChevronDown, ChevronUp, Calendar, Copy, Check, Inbox, Keyboard } from 'lucide-react';
import { MethodBadge, HeadersTable, JsonViewer } from '@/components/webhooks';
import { useWebhooks, useAvailableDates } from '@/hooks';
import { formatDate, formatRelativeTime, truncateId, tryParseJson } from '@/utils/formatters';
import { useDebounce } from '@/hooks/useDebounce';
import { format, subDays, isToday, isAfter, parseISO } from 'date-fns';
import type { WebhookRequest, HttpMethod } from '@/types';
import { HTTP_METHODS } from '@/types';

// Date filter presets
type DatePreset = 'all' | 'today' | 'yesterday' | 'last7days' | 'last30days' | 'custom';

const DATE_PRESETS: { value: DatePreset; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'custom', label: 'Custom Date' },
];

export function DashboardPage() {
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookRequest | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  // Filter states
  const [conversationFilter, setConversationFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState<HttpMethod | ''>('');
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [customDate, setCustomDate] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [sourceIpFilter, setSourceIpFilter] = useState('');
  const [hasBodyFilter, setHasBodyFilter] = useState<'all' | 'with' | 'without'>('all');

  // Debounce text inputs
  const debouncedConversationFilter = useDebounce(conversationFilter, 300);
  const debouncedSearchFilter = useDebounce(searchFilter, 300);
  const debouncedSourceIpFilter = useDebounce(sourceIpFilter, 300);

  // Get available dates for date picker
  const { data: datesData } = useAvailableDates();
  const availableDates = datesData?.dates || [];

  // Calculate effective date filter
  const effectiveDateFilter = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    switch (datePreset) {
      case 'today':
        return today;
      case 'yesterday':
        return format(subDays(new Date(), 1), 'yyyy-MM-dd');
      case 'custom':
        return customDate || undefined;
      default:
        return undefined;
    }
  }, [datePreset, customDate]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (methodFilter) count++;
    if (datePreset !== 'all') count++;
    if (debouncedSearchFilter) count++;
    if (debouncedSourceIpFilter) count++;
    if (hasBodyFilter !== 'all') count++;
    if (debouncedConversationFilter) count++;
    return count;
  }, [methodFilter, datePreset, debouncedSearchFilter, debouncedSourceIpFilter, hasBodyFilter, debouncedConversationFilter]);

  const { data, isLoading, error, refetch, isFetching } = useWebhooks({
    limit: 100,
    conversationId: debouncedConversationFilter || undefined,
    method: methodFilter || undefined,
    date: effectiveDateFilter,
    search: debouncedSearchFilter || undefined,
    sourceIp: debouncedSourceIpFilter || undefined,
  });

  // Client-side filter for date ranges and hasBody
  const filteredWebhooks = useMemo(() => {
    let webhooks = data?.data || [];
    
    // Date range filtering (client-side for presets like last7days, last30days)
    if (datePreset === 'last7days') {
      const cutoff = subDays(new Date(), 7);
      webhooks = webhooks.filter(w => {
        const date = parseISO(w.receivedAt);
        return isAfter(date, cutoff) || isToday(date);
      });
    } else if (datePreset === 'last30days') {
      const cutoff = subDays(new Date(), 30);
      webhooks = webhooks.filter(w => {
        const date = parseISO(w.receivedAt);
        return isAfter(date, cutoff) || isToday(date);
      });
    }
    
    // Has body filter
    if (hasBodyFilter === 'with') {
      webhooks = webhooks.filter(w => w.rawBody && w.rawBody.trim().length > 0);
    } else if (hasBodyFilter === 'without') {
      webhooks = webhooks.filter(w => !w.rawBody || w.rawBody.trim().length === 0);
    }
    
    return webhooks;
  }, [data, datePreset, hasBodyFilter]);

  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Clear all filters
  const clearAllFilters = () => {
    setConversationFilter('');
    setMethodFilter('');
    setDatePreset('all');
    setCustomDate('');
    setSearchFilter('');
    setSourceIpFilter('');
    setHasBodyFilter('all');
  };

  // Auto-select first webhook when data loads
  useEffect(() => {
    if (filteredWebhooks.length > 0 && !selectedWebhook) {
      setSelectedWebhook(filteredWebhooks[0]);
    }
  }, [filteredWebhooks, selectedWebhook]);

  // Update last updated time when data changes
  useEffect(() => {
    if (data) {
      setLastUpdated(new Date());
    }
  }, [data]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      refetch();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, refetch]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger if typing in an input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
      case 'j': {
        e.preventDefault();
        const currentIndex = filteredWebhooks.findIndex(w => w.id === selectedWebhook?.id);
        if (currentIndex < filteredWebhooks.length - 1) {
          setSelectedWebhook(filteredWebhooks[currentIndex + 1]);
        }
        break;
      }
      case 'ArrowUp':
      case 'k': {
        e.preventDefault();
        const currentIndex = filteredWebhooks.findIndex(w => w.id === selectedWebhook?.id);
        if (currentIndex > 0) {
          setSelectedWebhook(filteredWebhooks[currentIndex - 1]);
        }
        break;
      }
      case 'r':
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          refetch();
        }
        break;
      case 'Escape':
        setSelectedWebhook(null);
        break;
      case 'f':
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          setShowFilters(!showFilters);
        }
        break;
      case '?':
        e.preventDefault();
        setShowShortcuts(!showShortcuts);
        break;
    }
  }, [filteredWebhooks, selectedWebhook, refetch, showFilters, showShortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3">
          <Webhook className="h-6 w-6 text-primary-600" />
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight">
              Catchr
            </h1>
            <span className="text-xs text-gray-400 dark:text-gray-500 italic">
              Your requests called. We answered.
            </span>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {filteredWebhooks.length} of {data?.total || 0} requests
          </span>
        </div>

        <div className="flex items-center space-x-3">
          {/* Last updated indicator */}
          <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
            Updated {formatRelativeTime(lastUpdated.toISOString())}
          </span>

          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-2 py-1 text-xs rounded-lg border transition-colors ${
              autoRefresh
                ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700'
                : 'text-gray-500 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title={autoRefresh ? 'Auto-refresh ON (30s)' : 'Enable auto-refresh'}
          >
            {autoRefresh ? 'Auto ✓' : 'Auto'}
          </button>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            title="Refresh (R)"
          >
            <RefreshCw className={`h-5 w-5 ${isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className={`p-2 rounded-lg transition-colors ${
              showShortcuts 
                ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="h-5 w-5" />
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={darkMode ? 'Light mode' : 'Dark mode'}
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Keyboard Shortcuts Panel */}
      {showShortcuts && (
        <div className="absolute top-16 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg p-4 w-64">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
              <Keyboard className="h-4 w-4" />
              <span className="text-sm font-medium">Keyboard Shortcuts</span>
            </div>
            <button 
              onClick={() => setShowShortcuts(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
            <div className="flex justify-between">
              <span>Navigate requests</span>
              <div className="flex space-x-1">
                <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">↑</span>
                <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">↓</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span>Vim-style navigation</span>
              <div className="flex space-x-1">
                <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">j</span>
                <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">k</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span>Refresh data</span>
              <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">r</span>
            </div>
            <div className="flex justify-between">
              <span>Toggle filters</span>
              <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">f</span>
            </div>
            <div className="flex justify-between">
              <span>Clear selection</span>
              <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">Esc</span>
            </div>
            <div className="flex justify-between">
              <span>Show/hide this panel</span>
              <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">?</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Panel - Request List */}
        <div className="w-80 lg:w-96 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Filter Toggle & Quick Search */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 space-y-2">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search in payload..."
                className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter('')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg border transition-colors ${
                activeFilterCount > 0
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-0.5 text-xs bg-primary-500 text-white rounded-full">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="p-3 border-b border-gray-200 dark:border-gray-700 space-y-3 bg-gray-50 dark:bg-gray-800/50">
              {/* Method Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1.5">
                  HTTP Method
                </label>
                <div className="flex flex-wrap gap-1">
                  <MethodPill 
                    method="" 
                    label="All" 
                    isActive={methodFilter === ''} 
                    onClick={() => setMethodFilter('')} 
                  />
                  {HTTP_METHODS.map(method => (
                    <MethodPill
                      key={method}
                      method={method}
                      label={method}
                      isActive={methodFilter === method}
                      onClick={() => setMethodFilter(method)}
                    />
                  ))}
                </div>
              </div>

              {/* Date Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1.5">
                  <Calendar className="inline h-3 w-3 mr-1" />
                  Date Range
                </label>
                <select
                  value={datePreset}
                  onChange={(e) => setDatePreset(e.target.value as DatePreset)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                >
                  {DATE_PRESETS.map(preset => (
                    <option key={preset.value} value={preset.value}>{preset.label}</option>
                  ))}
                </select>
                {datePreset === 'custom' && (
                  <select
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="w-full mt-1.5 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select date...</option>
                    {availableDates.map(date => (
                      <option key={date} value={date}>{date}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Conversation ID Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1.5">
                  Conversation ID
                </label>
                <input
                  type="text"
                  value={conversationFilter}
                  onChange={(e) => setConversationFilter(e.target.value)}
                  placeholder="Filter by conversation..."
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Source IP Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1.5">
                  Source IP
                </label>
                <input
                  type="text"
                  value={sourceIpFilter}
                  onChange={(e) => setSourceIpFilter(e.target.value)}
                  placeholder="e.g., 192.168.1.1"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500"
                />
              </div>

              {/* Has Body Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1.5">
                  Request Body
                </label>
                <div className="flex space-x-2">
                  {(['all', 'with', 'without'] as const).map(option => (
                    <button
                      key={option}
                      onClick={() => setHasBodyFilter(option)}
                      className={`flex-1 px-2 py-1 text-xs rounded border transition-colors ${
                        hasBodyFilter === option
                          ? 'bg-primary-500 text-white border-primary-500'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-primary-400'
                      }`}
                    >
                      {option === 'all' ? 'All' : option === 'with' ? 'With Body' : 'No Body'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="w-full px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Request List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-500">
                Failed to load requests
              </div>
            ) : filteredWebhooks.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <p>No webhook requests found</p>
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="mt-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredWebhooks.map((webhook, index) => (
                  <RequestListItem
                    key={webhook.id || index}
                    webhook={webhook}
                    isSelected={selectedWebhook?.id === webhook.id}
                    onClick={() => setSelectedWebhook(webhook)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Request Details */}
        <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          {selectedWebhook ? (
            <RequestDetails webhook={selectedWebhook} darkMode={darkMode} />
          ) : (
            <EmptyState hasRequests={filteredWebhooks.length > 0} />
          )}
        </div>
      </div>
    </div>
  );
}

// Method pill component for filter
function MethodPill({ 
  method, 
  label, 
  isActive, 
  onClick 
}: { 
  method: string; 
  label: string; 
  isActive: boolean; 
  onClick: () => void;
}) {
  const getMethodColor = (m: string) => {
    switch (m.toUpperCase()) {
      case 'GET': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-green-300';
      case 'POST': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-300';
      case 'PUT': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 border-yellow-300';
      case 'PATCH': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 border-orange-300';
      case 'DELETE': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-red-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 border-gray-300';
    }
  };

  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 text-xs font-medium rounded border transition-all ${
        isActive
          ? method ? getMethodColor(method) + ' ring-2 ring-offset-1 ring-primary-500' : 'bg-primary-500 text-white border-primary-500'
          : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:border-gray-400'
      }`}
    >
      {label}
    </button>
  );
}

// Request list item component
function RequestListItem({ 
  webhook, 
  isSelected, 
  onClick 
}: { 
  webhook: WebhookRequest; 
  isSelected: boolean; 
  onClick: () => void;
}) {
  const conversationId = extractConversationId(webhook.rawBody);
  const bodySize = webhook.rawBody ? formatBytes(webhook.rawBody.length) : null;
  
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
        isSelected ? 'bg-primary-50 dark:bg-primary-900/30 border-l-4 border-primary-500 pl-2' : 'border-l-4 border-transparent'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center space-x-2">
          <MethodBadge method={webhook.method} />
          {bodySize && (
            <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded">
              {bodySize}
            </span>
          )}
        </div>
        <span 
          className="text-xs text-gray-500 dark:text-gray-400 cursor-help"
          title={formatDate(webhook.receivedAt)}
        >
          {formatRelativeTime(webhook.receivedAt)}
        </span>
      </div>
      <div className="text-sm font-mono text-gray-700 dark:text-gray-300 truncate">
        {webhook.path || '/'}
      </div>
      {conversationId && (
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
          Conv: {truncateId(conversationId, 16)}
        </div>
      )}
      {webhook.rawBody && (
        <div className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">
          {getPayloadPreview(webhook.rawBody)}
        </div>
      )}
    </button>
  );
}

// Request details component
function RequestDetails({ webhook, darkMode }: { webhook: WebhookRequest; darkMode: boolean }) {
  const [activeTab, setActiveTab] = useState<'body' | 'headers' | 'query'>('body');
  const bodySize = webhook.rawBody ? formatBytes(webhook.rawBody.length) : null;

  return (
    <div className="p-6 space-y-6">
      {/* Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center space-x-3 mb-4">
          <MethodBadge method={webhook.method} />
          <CopyableText 
            text={webhook.path || '/'} 
            className="text-lg font-mono text-gray-900 dark:text-white"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-xs uppercase">Request ID</label>
            <CopyableText 
              text={webhook.id} 
              className="font-mono text-gray-900 dark:text-white text-xs break-all"
            />
          </div>
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-xs uppercase">Received At</label>
            <p className="text-gray-900 dark:text-white" title={webhook.receivedAt}>
              {formatDate(webhook.receivedAt)}
            </p>
          </div>
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-xs uppercase">Source IP</label>
            {webhook.sourceIp ? (
              <CopyableText 
                text={webhook.sourceIp} 
                className="font-mono text-gray-900 dark:text-white"
              />
            ) : (
              <p className="text-gray-400">-</p>
            )}
          </div>
          <div>
            <label className="text-gray-500 dark:text-gray-400 text-xs uppercase">Content Type</label>
            <p className="text-gray-900 dark:text-white">
              {webhook.contentType || '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <TabButton 
            active={activeTab === 'body'} 
            onClick={() => setActiveTab('body')}
            label="Body"
            badge={bodySize}
          />
          <TabButton 
            active={activeTab === 'headers'} 
            onClick={() => setActiveTab('headers')}
            label="Headers"
            count={Object.keys(webhook.headers || {}).length}
          />
          <TabButton 
            active={activeTab === 'query'} 
            onClick={() => setActiveTab('query')}
            label="Query Params"
            count={Object.keys(webhook.queryParameters || {}).length}
          />
        </div>

        <div className="p-4">
          {activeTab === 'body' && (
            <div>
              {webhook.rawBody ? (
                <JsonViewer content={webhook.rawBody} darkMode={darkMode} />
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">No body content</p>
              )}
            </div>
          )}
          {activeTab === 'headers' && (
            <HeadersTable headers={webhook.headers || {}} title="Headers" />
          )}
          {activeTab === 'query' && (
            <HeadersTable headers={webhook.queryParameters || {}} title="Query Parameters" />
          )}
        </div>
      </div>
    </div>
  );
}

// Tab button component
function TabButton({ 
  active, 
  onClick, 
  label, 
  count,
  badge 
}: { 
  active: boolean; 
  onClick: () => void; 
  label: string; 
  count?: number;
  badge?: string | null;
}) {
  const displayValue = badge || (count && count > 0 ? String(count) : null);
  
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm font-medium transition-colors ${
        active
          ? 'text-primary-600 border-b-2 border-primary-600'
          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
      }`}
    >
      {label}
      {displayValue && (
        <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
          active 
            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
        }`}>
          {displayValue}
        </span>
      )}
    </button>
  );
}

// Empty state component
function EmptyState({ hasRequests }: { hasRequests: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-8">
      <Inbox className="h-16 w-16 mb-4 text-gray-300 dark:text-gray-600" />
      <h3 className="text-lg font-medium mb-2">
        {hasRequests ? 'Select a request' : 'No requests yet'}
      </h3>
      <p className="text-sm text-center mb-6 max-w-sm">
        {hasRequests 
          ? 'Click on a request from the list to view its details here.'
          : 'Webhook requests will appear here once they start arriving.'}
      </p>
      
      {/* Keyboard shortcuts */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 w-full max-w-xs">
        <div className="flex items-center space-x-2 mb-3 text-gray-700 dark:text-gray-300">
          <Keyboard className="h-4 w-4" />
          <span className="text-sm font-medium">Keyboard Shortcuts</span>
        </div>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span>Navigate requests</span>
            <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">↑ ↓</span>
          </div>
          <div className="flex justify-between">
            <span>Refresh data</span>
            <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">R</span>
          </div>
          <div className="flex justify-between">
            <span>Toggle filters</span>
            <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">F</span>
          </div>
          <div className="flex justify-between">
            <span>Clear selection</span>
            <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">Esc</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Copyable text component
function CopyableText({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group flex items-center space-x-1">
      <span className={className}>{text}</span>
      <button
        onClick={handleCopy}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        title="Copy to clipboard"
      >
        {copied ? (
          <Check className="h-3 w-3 text-green-500" />
        ) : (
          <Copy className="h-3 w-3 text-gray-400" />
        )}
      </button>
    </div>
  );
}

// Helper functions
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function extractConversationId(rawBody: string | undefined): string | null {
  if (!rawBody) return null;
  const parsed = tryParseJson(rawBody);
  if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    if (obj.conversation && typeof obj.conversation === 'object') {
      const conv = obj.conversation as Record<string, unknown>;
      if (typeof conv.id === 'string') {
        return conv.id;
      }
    }
  }
  return null;
}

function getPayloadPreview(rawBody: string): string {
  const parsed = tryParseJson(rawBody);
  if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    if (obj.type) return `type: ${obj.type}`;
    const keys = Object.keys(obj).slice(0, 2).join(', ');
    return `{ ${keys}${Object.keys(obj).length > 2 ? ', ...' : ''} }`;
  }
  return rawBody.substring(0, 50) + (rawBody.length > 50 ? '...' : '');
}
