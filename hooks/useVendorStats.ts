import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export interface VendorStats {
  monthly_revenue: number;
  pending_orders: number;
  active_products: number;
  monthly_views: number;
}

interface VendorStatsResponse {
  data: VendorStats;
}

/** Prêt pour P7-3 — endpoint à brancher côté backend */
export function useVendorStats() {
  return useQuery({
    queryKey: ['vendor', 'stats'],
    queryFn: () => api.get<VendorStatsResponse>('/api/vendor/stats').then((res) => res.data),
  });
}

interface ChartPoint {
  date: string;
  label: string;
  revenue: number;
}

interface ChartResponse {
  data: ChartPoint[];
}

export function useRevenueChart(period: 'week' | 'month' | 'year' = 'month') {
  return useQuery({
    queryKey: ['vendor', 'stats', 'chart', period],
    queryFn: () =>
      api
        .get<ChartResponse>(`/api/vendor/stats/chart?period=${period}`)
        .then((res) => res.data),
  });
}
