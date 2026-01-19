import { ArrowLeft, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { MethodBadge } from './MethodBadge';
import { HeadersTable } from './HeadersTable';
import { JsonViewer } from './JsonViewer';
import { formatDate, formatRelativeTime } from '@/utils/formatters';
import type { WebhookRequest } from '@/types';

interface WebhookDetailProps {
  webhook: WebhookRequest;
}

export function WebhookDetail({ webhook }: WebhookDetailProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [headersExpanded, setHeadersExpanded] = useState(true);
  const [queryParamsExpanded, setQueryParamsExpanded] = useState(true);
  const [bodyExpanded, setBodyExpanded] = useState(true);

  const handleCopyId = async () => {
    await navigator.clipboard.writeText(webhook.id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const isDarkMode = document.documentElement.classList.contains('dark');

  return (
    <div className="space-y-6">
      {/* Back button and header */}
      <div className="flex items-center justify-between">
        <Link
          to="/webhooks"
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Webhooks
        </Link>
      </div>

      {/* Overview Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <MethodBadge method={webhook.method} />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white font-mono">
                {webhook.path}
              </h2>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-mono">{webhook.id}</span>
              <button
                onClick={handleCopyId}
                className="p-1 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                title="Copy ID"
              >
                {copiedId ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Received At
            </label>
            <p className="text-gray-900 dark:text-white">
              {formatDate(webhook.receivedAt)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatRelativeTime(webhook.receivedAt)}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Source IP
            </label>
            <p className="text-gray-900 dark:text-white font-mono">
              {webhook.sourceIp}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Content Type
            </label>
            <p className="text-gray-900 dark:text-white">
              {webhook.contentType || 'Not specified'}
            </p>
          </div>
        </div>
      </div>

      {/* Headers Section */}
      <CollapsibleSection
        title="Headers"
        count={Object.keys(webhook.headers).length}
        expanded={headersExpanded}
        onToggle={() => setHeadersExpanded(!headersExpanded)}
      >
        <HeadersTable headers={webhook.headers} title="Headers" />
      </CollapsibleSection>

      {/* Query Parameters Section */}
      <CollapsibleSection
        title="Query Parameters"
        count={Object.keys(webhook.queryParameters).length}
        expanded={queryParamsExpanded}
        onToggle={() => setQueryParamsExpanded(!queryParamsExpanded)}
      >
        <HeadersTable headers={webhook.queryParameters} title="Query Parameters" />
      </CollapsibleSection>

      {/* Body Section */}
      <CollapsibleSection
        title="Request Body"
        expanded={bodyExpanded}
        onToggle={() => setBodyExpanded(!bodyExpanded)}
      >
        <JsonViewer content={webhook.rawBody} darkMode={isDarkMode} />
      </CollapsibleSection>
    </div>
  );
}

interface CollapsibleSectionProps {
  title: string;
  count?: number;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({
  title,
  count,
  expanded,
  onToggle,
  children,
}: CollapsibleSectionProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-lg"
      >
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {title}
          </h3>
          {count !== undefined && (
            <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
              {count}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>
      {expanded && <div className="px-6 pb-6">{children}</div>}
    </div>
  );
}
