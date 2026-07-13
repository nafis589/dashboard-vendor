import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  conversationsApi,
  type ChatConversation,
  type ConversationThread,
} from '@/lib/conversations-api';

export const CONVERSATIONS_KEY = ['vendor', 'conversations'] as const;

export const messagesKey = (conversationId: string) =>
  ['vendor', 'conversation', conversationId, 'messages'] as const;

export function useConversations() {
  return useQuery({
    queryKey: CONVERSATIONS_KEY,
    queryFn: conversationsApi.list,
    staleTime: 15_000,
  });
}

/** Total des messages non lus, toutes conversations confondues. */
export function useUnreadMessagesCount() {
  return useQuery({
    queryKey: CONVERSATIONS_KEY,
    queryFn: conversationsApi.list,
    staleTime: 15_000,
    select: (conversations: ChatConversation[]) =>
      conversations.reduce((total, c) => total + (c.unread_count ?? 0), 0),
  });
}

export function useConversationMessages(conversationId: string | null) {
  return useQuery({
    queryKey: messagesKey(conversationId ?? '__none__'),
    queryFn: () => conversationsApi.getMessages(conversationId as string),
    enabled: !!conversationId,
    staleTime: 10_000,
  });
}

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => conversationsApi.sendMessage(conversationId, content, 'TEXT'),
    onSuccess: (message) => {
      queryClient.setQueryData<ConversationThread>(messagesKey(conversationId), (prev) => {
        if (!prev) return prev;
        if (prev.messages.some((m) => m.id === message.id)) return prev;
        return { ...prev, messages: [...prev.messages, message] };
      });
      void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    },
  });
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => conversationsApi.markRead(conversationId),
    onSuccess: (_data, conversationId) => {
      queryClient.setQueryData<ChatConversation[]>(CONVERSATIONS_KEY, (prev) =>
        prev?.map((c) => (c.id === conversationId ? { ...c, unread_count: 0 } : c)),
      );
      void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    },
  });
}
