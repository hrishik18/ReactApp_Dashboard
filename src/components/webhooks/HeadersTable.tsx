import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface HeadersTableProps {
  headers: Record<string, string>;
  title?: string;
}

export function HeadersTable({ headers, title = 'Headers' }: HeadersTableProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const entries = Object.entries(headers);

  if (entries.length === 0) {
    return (
      <div className="text-gray-500 dark:text-gray-400 text-sm italic">
        No {title.toLowerCase()} present
      </div>
    );
  }

  const handleCopy = async (key: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th
              scope="col"
              className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/3"
            >
              Key
            </th>
            <th
              scope="col"
              className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
            >
              Value
            </th>
            <th scope="col" className="px-4 py-2 w-10" />
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {entries.map(([key, value]) => (
            <tr key={key} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white break-all">
                {key}
              </td>
              <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 break-all font-mono">
                {value}
              </td>
              <td className="px-4 py-2">
                <button
                  onClick={() => handleCopy(key, value)}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="Copy value"
                >
                  {copiedKey === key ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
