'use client';

import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { toast } from 'sonner';

import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:9000';

interface OfferNewPayload {
  productTitle?: string;
  amount?: number;
}

export function useOfferSocket() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('offer:new', (payload: OfferNewPayload) => {
      const title = payload.productTitle ?? 'un article';
      const amount = payload.amount != null ? payload.amount.toLocaleString('fr-FR') : '—';
      toast.info(`Nouvelle offre reçue pour ${title} : ${amount} FCFA`);
      queryClient.invalidateQueries({ queryKey: ['vendor', 'offers'] });
      queryClient.invalidateQueries({ queryKey: ['vendor', 'offers', 'pending-count'] });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, queryClient]);
}
