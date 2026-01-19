import { HTTP_METHODS } from '@/types';
import { METHOD_COLORS } from '@/utils/constants';

interface MethodFilterProps {
  value?: string;
  onChange: (method: string | undefined) => void;
}

export function MethodFilter({ value, onChange }: MethodFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange(undefined)}
        className={`px-3 py-1 text-sm rounded-full border transition-colors ${
          !value
            ? 'bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900'
            : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
      >
        All
      </button>
      {HTTP_METHODS.map((method) => (
        <button
          key={method}
          onClick={() => onChange(method === value ? undefined : method)}
          className={`px-3 py-1 text-sm rounded-full border transition-colors ${
            value === method
              ? METHOD_COLORS[method]
              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          {method}
        </button>
      ))}
    </div>
  );
}
