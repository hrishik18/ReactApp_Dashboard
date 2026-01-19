import { format, subDays } from 'date-fns';
import { Calendar } from 'lucide-react';
import { DATE_PRESETS } from '@/utils/constants';

interface DateFilterProps {
  value?: string;
  onChange: (date: string | undefined) => void;
}

export function DateFilter({ value, onChange }: DateFilterProps) {
  const handlePresetClick = (preset: string) => {
    const today = new Date();
    
    switch (preset) {
      case 'today':
        onChange(format(today, 'yyyy-MM-dd'));
        break;
      case 'yesterday':
        onChange(format(subDays(today, 1), 'yyyy-MM-dd'));
        break;
      case 'last7days':
        onChange(format(subDays(today, 7), 'yyyy-MM-dd'));
        break;
      case 'last30days':
        onChange(format(subDays(today, 30), 'yyyy-MM-dd'));
        break;
      case 'all':
        onChange(undefined);
        break;
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center space-x-2">
        <Calendar className="h-4 w-4 text-gray-500" />
        <input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value || undefined)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>
      
      <div className="flex flex-wrap gap-1">
        {DATE_PRESETS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => handlePresetClick(preset.value)}
            className="px-3 py-1 text-sm rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
