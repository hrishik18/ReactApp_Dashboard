import { Link } from 'react-router-dom';
import { MethodBadge } from './MethodBadge';
import { truncateId, formatDate, formatRelativeTime, tryParseJson } from '@/utils/formatters';
import type { WebhookRequest } from '@/types';

interface WebhookTableProps {
  webhooks: WebhookRequest[];
  isLoading?: boolean;
}

// Format payload for display - pretty print JSON if possible
function formatPayload(rawBody: string | undefined): string {
  if (!rawBody || rawBody.trim() === '') return '(empty)';
  const parsed = tryParseJson(rawBody);
  if (parsed) {
    return JSON.stringify(parsed, null, 2);
  }
  return rawBody;
}

// Extract conversation ID from payload
export function extractConversationId(rawBody: string | undefined): string | null {
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

export function WebhookTable({ webhooks, isLoading }: WebhookTableProps) {
  if (isLoading) {
    return <WebhookTableSkeleton />;
  }

  if (webhooks.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400">No webhook requests found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              ID
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              Received At
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              Method
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              Conv. ID
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[400px]"
            >
              Payload
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {webhooks.map((webhook, index) => {
            const conversationId = extractConversationId(webhook.rawBody);
            return (
              <tr
                key={webhook.id || `webhook-${index}`}
                className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <td className="px-4 py-4 whitespace-nowrap">
                  <Link
                    to={`/webhooks/${webhook.id}`}
                    className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline font-mono"
                    title={webhook.id}
                  >
                    {truncateId(webhook.id)}
                  </Link>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {formatDate(webhook.receivedAt)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatRelativeTime(webhook.receivedAt)}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <MethodBadge method={webhook.method} />
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {conversationId ? (
                    <span 
                      className="text-xs font-mono text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
                      title={conversationId}
                    >
                      {truncateId(conversationId, 12)}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-xs">-</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div 
                    className="font-mono bg-gray-50 dark:bg-gray-800 rounded px-3 py-2 max-w-lg max-h-32 overflow-auto border border-gray-200 dark:border-gray-700"
                  >
                    <pre className="whitespace-pre-wrap break-all text-xs text-gray-800 dark:text-gray-200">
                      {formatPayload(webhook.rawBody)}
                    </pre>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function WebhookTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="animate-pulse">
        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
