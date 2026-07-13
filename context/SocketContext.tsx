'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import { toast } from 'sonner';

import { useAuth } from '@/context/AuthContext';
import { CONVERSATIONS_KEY, messagesKey } from '@/hooks/useConversations';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:9000';

export interface IncomingMessage {
  id: string;
  content: string;
  sender_id: string;
  type: string;
  created_at: string;
}

export interface MessageNewPayload {
  conversationId: string;
  message: IncomingMessage;
}

type MessageHandler = (payload: MessageNewPayload) => void;

interface OfferNewPayload {
  productTitle?: string;
  amount?: number;
}

interface SocketContextValue {
  socket: Socket | null;
  /** Subscribe to raw `message:new` events. Returns an unsubscribe function. */
  onMessage: (handler: MessageHandler) => () => void;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const handlersRef = useRef<Set<MessageHandler>>(new Set());
  const [socket, setSocket] = useState<Socket | null>(null);

  const onMessage = useCallback((handler: MessageHandler) => {
    handlersRef.current.add(handler);
    return () => {
      handlersRef.current.delete(handler);
    };
  }, []);

  useEffect(() => {
    if (!token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
      return;
    }

    const s = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = s;
    setSocket(s);

    s.on('message:new', (payload: MessageNewPayload) => {
      handlersRef.current.forEach((handler) => handler(payload));
      void queryClient.invalidateQueries({ queryKey: messagesKey(payload.conversationId) });
      void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    });

    s.on('conversation:updated', () => {
      void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    });

    s.on('offer:new', (payload: OfferNewPayload) => {
      const title = payload.productTitle ?? 'un article';
      const amount = payload.amount != null ? payload.amount.toLocaleString('fr-FR') : '—';
      toast.info(`Nouvelle offre reçue pour ${title} : ${amount} FCFA`);
      void queryClient.invalidateQueries({ queryKey: ['vendor', 'offers'] });
      void queryClient.invalidateQueries({ queryKey: ['vendor', 'offers', 'pending-count'] });
    });

    return () => {
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
    };
  }, [token, queryClient]);

  return <SocketContext.Provider value={{ socket, onMessage }}>{children}</SocketContext.Provider>;
}

export function useSocket(): SocketContextValue {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
