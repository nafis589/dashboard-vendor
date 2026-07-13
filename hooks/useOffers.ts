import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { PaginatedMeta, VendorOffer } from '@/lib/types';

interface OffersListResponse {
  data: VendorOffer[];
  meta: PaginatedMeta;
}

interface OfferResponse {
  data: VendorOffer;
}

export function usePendingOffersCount() {
  return useQuery({
    queryKey: ['vendor', 'offers', 'pending-count'],
    queryFn: async () => {
      const res = await api.get<OffersListResponse>(
        '/api/vendor/offers?status=PENDING&limit=1',
      );
      return res.meta.total;
    },
    staleTime: 30_000,
  });
}

export function useOffers(params?: { status?: string; page?: number; limit?: number }) {
  const search = new URLSearchParams();
  if (params?.status) search.set('status', params.status);
  if (params?.page) search.set('page', String(params.page));
  if (params?.limit) search.set('limit', String(params.limit));
  const qs = search.toString();

  return useQuery({
    queryKey: ['vendor', 'offers', params],
    queryFn: async () => {
      const res = await api.get<OffersListResponse>(`/api/vendor/offers${qs ? `?${qs}` : ''}`);
      return {
        ...res,
        data: res.data.map((offer) => ({
          ...offer,
          buyer_name: offer.buyer_name?.trim() || 'Client',
        })),
      };
    },
  });
}

export function useAcceptOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (offerId: string) =>
      api.patch<OfferResponse>(`/api/vendor/offers/${offerId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'offers'] });
      queryClient.invalidateQueries({ queryKey: ['vendor', 'offers', 'pending-count'] });
    },
  });
}

export function useDeclineOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (offerId: string) =>
      api.patch<OfferResponse>(`/api/vendor/offers/${offerId}/decline`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'offers'] });
      queryClient.invalidateQueries({ queryKey: ['vendor', 'offers', 'pending-count'] });
    },
  });
}

export function useCounterOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ offerId, counter_amount }: { offerId: string; counter_amount: number }) =>
      api.patch<OfferResponse>(`/api/vendor/offers/${offerId}/counter`, { counter_amount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'offers'] });
      queryClient.invalidateQueries({ queryKey: ['vendor', 'offers', 'pending-count'] });
    },
  });
}
