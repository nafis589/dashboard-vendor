'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { VendorOrder } from '@/lib/types';

interface OrdersListResponse {
  data: VendorOrder[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export function useRecentOrders(limit = 5) {
  return useQuery({
    queryKey: ['vendor', 'orders', 'recent', limit],
    queryFn: () =>
      api.get<OrdersListResponse>(`/api/vendor/orders?limit=${limit}`),
    select: (res) => res.data,
  });
}
