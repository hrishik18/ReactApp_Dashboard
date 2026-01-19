import { JsonView, darkStyles, defaultStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';
import { Copy, Check } from 'lucide-react';
import { useState, useMemo } from 'react';
import { tryParseJson } from '@/utils/formatters';

interface JsonViewerProps {
  content: string;
  darkMode?: boolean;
}

export function JsonViewer({ content, darkMode = false }: JsonViewerProps) {
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const parsedJson = useMemo(() => tryParseJson(content), [content]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(
      parsedJson ? JSON.stringify(parsedJson, null, 2) : content
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <div className="absolute top-2 right-2 flex space-x-2 z-10">
        {parsedJson && (
          <button
            onClick={() => setShowRaw(!showRaw)}
            className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            {showRaw ? 'Formatted' : 'Raw'}
          </button>
        )}
        <button
          onClick={handleCopy}
          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          title="Copy content"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-auto max-h-96">
        {parsedJson && !showRaw ? (
          <div className="p-4">
            <JsonView
              data={parsedJson}
              style={darkMode ? darkStyles : defaultStyles}
            />
          </div>
        ) : (
          <pre className="p-4 text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-all">
            {content || '(empty)'}
          </pre>
        )}
      </div>
    </div>
  );
}
