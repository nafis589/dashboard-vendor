import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type {
  VendorShippingConfig,
  VendorShippingConfigResponse,
  VendorShippingRegionInput,
} from '@/lib/types';

function normalizeShippingConfig(response: VendorShippingConfigResponse): VendorShippingConfig {
  const raw = response.data;
  const loc = raw.location;
  if (!loc) return raw;

  const lat = Number(
    loc.lat ?? (loc as VendorShippingConfig['location'] & { latitude?: number }).latitude,
  );
  const lng = Number(
    loc.lng ?? (loc as VendorShippingConfig['location'] & { longitude?: number }).longitude,
  );

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { ...raw, location: { ...loc, lat: NaN, lng: NaN } };
  }

  return { ...raw, location: { ...loc, lat, lng } };
}

export function useVendorShipping() {
  return useQuery({
    queryKey: ['vendor', 'shipping'],
    queryFn: () =>
      api
        .get<VendorShippingConfigResponse>('/api/vendor/shipping')
        .then((res) => normalizeShippingConfig(res)),
  });
}

export function useUpdateVendorShipping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      location?: { lat: number; lng: number; address?: string | null; city?: string | null };
      regions?: VendorShippingRegionInput[];
    }) => api.patch<VendorShippingConfigResponse>('/api/vendor/shipping', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', 'shipping'] });
    },
  });
}
