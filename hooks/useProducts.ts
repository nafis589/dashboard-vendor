import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { VendorProduct } from '@/lib/types';

interface ProductsListResponse {
  data: VendorProduct[];
  meta?: { total: number };
}

export function useProducts(params?: {
  status?: string;
  search?: string;
  low_stock?: boolean;
}) {
  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  if (params?.search) search.set('search', params.search);
  if (params?.low_stock) search.set('low_stock', 'true');
  const qs = search.toString();

  return useQuery({
    queryKey: ['vendor', 'products', params],
    queryFn: () =>
      api.get<ProductsListResponse>(`/api/vendor/products${qs ? `?${qs}` : ''}`),
  });
}

export function useLowStockProducts() {
  return useQuery({
    queryKey: ['vendor', 'products', 'low-stock'],
    queryFn: async () => {
      const res = await api.get<ProductsListResponse>('/api/vendor/products?low_stock=true');
      return res.data;
    },
  });
}
