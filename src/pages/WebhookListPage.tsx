import { useState } from 'react';
import { Header } from '@/components/layout';
import { 
  SearchInput, 
  DateFilter, 
  Pagination, 
  ErrorMessage,
  MethodFilter 
} from '@/components/common';
import { WebhookTable } from '@/components/webhooks';
import { useWebhooks } from '@/hooks';
import { DEFAULT_PAGE_SIZE } from '@/utils/constants';

export function WebhookListPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState('');
  const [conversationId, setConversationId] = useState('');
  const [date, setDate] = useState<string | undefined>();
  const [method, setMethod] = useState<string | undefined>();

  const { data, isLoading, error, refetch } = useWebhooks({
    page,
    limit: pageSize,
    search: search || undefined,
    conversationId: conversationId || undefined,
    date,
    method,
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleConversationIdChange = (value: string) => {
    setConversationId(value);
    setPage(1);
  };

  const handleDateChange = (value: string | undefined) => {
    setDate(value);
    setPage(1);
  };

  const handleMethodChange = (value: string | undefined) => {
    setMethod(value);
    setPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  return (
    <>
      <Header 
        title="Webhook Requests" 
        onRefresh={() => refetch()} 
        isRefreshing={isLoading}
      />
      
      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1 max-w-xs">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                Search by ID
              </label>
              <SearchInput
                value={search}
                onChange={handleSearchChange}
                placeholder="Webhook ID..."
              />
            </div>
            <div className="flex-1 max-w-xs">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                Conversation ID
              </label>
              <SearchInput
                value={conversationId}
                onChange={handleConversationIdChange}
                placeholder="Filter by conversation ID..."
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                Date
              </label>
              <DateFilter value={date} onChange={handleDateChange} />
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Filter by Method
            </label>
            <MethodFilter value={method} onChange={handleMethodChange} />
          </div>
        </div>

        {/* Error State */}
        {error && (
          <ErrorMessage
            message={error instanceof Error ? error.message : 'Failed to load webhooks'}
            onRetry={() => refetch()}
          />
        )}

        {/* Table */}
        {!error && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <WebhookTable webhooks={data?.data || []} isLoading={isLoading} />
            
            {data && data.total > 0 && (
              <div className="px-4 border-t border-gray-200 dark:border-gray-700">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={data.total}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
