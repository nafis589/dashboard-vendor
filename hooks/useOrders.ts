import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

interface OrdersListResponse {
  data: unknown[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export function usePendingOrdersCount() {
  return useQuery({
    queryKey: ['vendor', 'orders', 'pending-count'],
    queryFn: async () => {
      const res = await api.get<OrdersListResponse>(
        '/api/vendor/orders?status=PENDING&limit=1',
      );
      return res.meta.total;
    },
    staleTime: 30_000,
  });
}

export function useOrders(params?: { status?: string; page?: number; limit?: number }) {
  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  if (params?.page) search.set('page', String(params.page));
  if (params?.limit) search.set('limit', String(params.limit));
  const qs = search.toString();

  return useQuery({
    queryKey: ['vendor', 'orders', params],
    queryFn: () => api.get<OrdersListResponse>(`/api/vendor/orders${qs ? `?${qs}` : ''}`),
  });
}
