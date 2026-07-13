'use client';

import { useOfferSocket } from '@/hooks/useOfferSocket';

export function OfferSocketListener() {
  useOfferSocket();
  return null;
}
