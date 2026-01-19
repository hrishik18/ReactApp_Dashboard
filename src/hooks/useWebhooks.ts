import { useQuery } from '@tanstack/react-query';
import { 
  getWebhooks, 
  getWebhookById, 
  getAvailableDates, 
  getWebhookStats 
} from '@/api/webhookApi';
import { QUERY_KEYS, REFRESH_INTERVALS } from '@/utils/constants';
import type { WebhookQueryParams } from '@/types';

/**
 * Hook to fetch paginated webhooks with filters
 */
export function useWebhooks(params: WebhookQueryParams = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.webhooks, params],
    queryFn: () => getWebhooks(params),
    staleTime: REFRESH_INTERVALS.webhookList,
  });
}

/**
 * Hook to fetch a single webhook by ID
 */
export function useWebhook(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.webhook, id],
    queryFn: () => getWebhookById(id),
    enabled: !!id,
  });
}

/**
 * Hook to fetch available dates (blob folders)
 */
export function useAvailableDates() {
  return useQuery({
    queryKey: [QUERY_KEYS.dates],
    queryFn: getAvailableDates,
    staleTime: REFRESH_INTERVALS.stats,
  });
}

/**
 * Hook to fetch webhook statistics
 */
export function useWebhookStats() {
  return useQuery({
    queryKey: [QUERY_KEYS.stats],
    queryFn: getWebhookStats,
    staleTime: REFRESH_INTERVALS.stats,
  });
}
