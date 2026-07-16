import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type {
  UpdateVendorProfilePayload,
  VendorProfile,
  VendorProfileDetailResponse,
} from '@/lib/types';

function normalizeProfile(profile: VendorProfile): VendorProfile {
  return {
    ...profile,
    followers_count: profile.followers_count ?? 0,
    following_count: profile.following_count ?? 0,
  };
}

export function useVendorProfile() {
  return useQuery({
    queryKey: ['vendor', 'profile'],
    queryFn: () =>
      api
        .get<VendorProfileDetailResponse>('/api/vendor/profile')
        .then((res) => normalizeProfile(res.data)),
  });
}

export function useUpdateVendorProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateVendorProfilePayload) =>
      api
        .patch<VendorProfileDetailResponse>('/api/vendor/profile', payload)
        .then((res) => res.data),
    onSuccess: (data) => {
      queryClient.setQueryData<VendorProfile>(['vendor', 'profile'], normalizeProfile(data));
    },
  });
}
