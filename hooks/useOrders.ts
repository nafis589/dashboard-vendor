import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { OrderStatus, PaginatedMeta, VendorOrder, VendorOrderDetail } from '@/lib/types';

interface OrdersListResponse {
  data: VendorOrder[];
  meta: PaginatedMeta;
}

interface OrderDetailResponse {
  data: VendorOrderDetail;
}

interface OrderResponse {
  data: VendorOrder;
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

export function useOrderDetail(orderId: string) {
  return useQuery({
    queryKey: ['vendor', 'orders', orderId],
    queryFn: () => api.get<OrderDetailResponse>(`/api/vendor/orders/${orderId}`),
    enabled: Boolean(orderId),
  });
}

export function useUpdateOrderStatus(orderId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { status: OrderStatus; note?: string }) =>
      api.patch<OrderResponse>(`/api/vendor/orders/${orderId}/status`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['vendor', 'orders', orderId] });
      queryClient.invalidateQueries({ queryKey: ['vendor', 'orders', 'recent'] });
    },
  });
}
