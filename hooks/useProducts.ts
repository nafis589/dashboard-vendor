import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { fetchStoreCategories } from '@/lib/categories';
import type { PaginatedMeta, VendorProduct, VendorProductDetail } from '@/lib/types';
import type { ProductFormValues } from '@/lib/product-schema';
import { resolveCategoryId } from '@/lib/categories';
import type { StoreCategory } from '@/lib/categories';

interface ProductsListResponse {
  data: VendorProduct[];
  meta: PaginatedMeta;
}

interface ProductDetailResponse {
  data: VendorProductDetail;
}

export interface ProductsQueryParams {
  status?: string;
  search?: string;
  category_id?: string;
  low_stock?: boolean;
  page?: number;
  limit?: number;
}

function buildProductsQuery(params?: ProductsQueryParams): string {
  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  if (params?.search) search.set('search', params.search);
  if (params?.category_id) search.set('category_id', params.category_id);
  if (params?.low_stock) search.set('low_stock', 'true');
  if (params?.page) search.set('page', String(params.page));
  if (params?.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  return `/api/vendor/products${qs ? `?${qs}` : ''}`;
}

export function useProducts(params?: ProductsQueryParams) {
  return useQuery({
    queryKey: ['vendor', 'products', params],
    queryFn: () => api.get<ProductsListResponse>(buildProductsQuery(params)),
  });
}

export function useProduct(productId: string) {
  return useQuery({
    queryKey: ['vendor', 'products', productId],
    queryFn: () => api.get<ProductDetailResponse>(`/api/vendor/products/${productId}`),
    enabled: Boolean(productId),
  });
}

export function useStoreCategories() {
  return useQuery({
    queryKey: ['store', 'categories'],
    queryFn: fetchStoreCategories,
    staleTime: 5 * 60 * 1000,
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

function formToPayload(
  values: ProductFormValues,
  status: 'DRAFT' | 'PENDING_REVIEW',
  categories: StoreCategory[],
) {
  return {
    title: values.title,
    description: values.description || null,
    category_id: resolveCategoryId(categories, values.category_id, values.subcategory_id),
    brand: values.brand || null,
    condition: values.condition,
    material: values.material || null,
    color: values.color || null,
    size: values.size || null,
    price: values.price,
    stock: values.stock,
    images: values.images,
    status,
  };
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      values,
      status,
      categories,
    }: {
      values: ProductFormValues;
      status: 'DRAFT' | 'PENDING_REVIEW';
      categories: StoreCategory[];
    }) => {
      const body = formToPayload(values, status, categories);
      return api.post<ProductDetailResponse>('/api/vendor/products', body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'products'] });
    },
  });
}

export function useUpdateProduct(productId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      values,
      status,
      categories,
    }: {
      values: ProductFormValues;
      status: 'DRAFT' | 'PENDING_REVIEW';
      categories: StoreCategory[];
    }) => {
      const { images, ...rest } = formToPayload(values, status, categories);
      const body = {
        ...rest,
        images,
        status,
      };
      return api.patch<ProductDetailResponse>(`/api/vendor/products/${productId}`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['vendor', 'products', productId] });
    },
  });
}

export function useToggleProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) =>
      api.patch<ProductDetailResponse>(`/api/vendor/products/${productId}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'products'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) =>
      api.delete<{ data: { message: string } }>(`/api/vendor/products/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'products'] });
    },
  });
}
