import { METHOD_COLORS } from '@/utils/constants';

interface MethodBadgeProps {
  method?: string;
}

export function MethodBadge({ method }: MethodBadgeProps) {
  if (!method) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
        -
      </span>
    );
  }

  const upperMethod = method.toUpperCase();
  const colorClass = METHOD_COLORS[upperMethod] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${colorClass}`}
    >
      {upperMethod}
    </span>
  );
}
