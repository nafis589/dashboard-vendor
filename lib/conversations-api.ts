import { api } from '@/lib/api-client';

export type MessageType = 'TEXT' | 'OFFER' | 'SYSTEM';

export interface ChatCounterpart {
  name: string;
  username: string;
  avatar: string | null;
}

export interface ChatProduct {
  id: string;
  title: string;
  brand: string | null;
  condition: string | null;
  price: number | null;
  image: string | null;
}

export interface ChatConversation {
  id: string;
  role: 'buyer' | 'vendor';
  counterpart: ChatCounterpart;
  product: ChatProduct | null;
  last_message: {
    content: string;
    sender_id: string;
    type: string;
    created_at: string;
  } | null;
  last_message_at: string | null;
  unread_count: number;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  type: MessageType;
  is_read: boolean;
  mine: boolean;
  created_at: string;
}

export interface ConversationThread {
  conversation: ChatConversation;
  messages: ChatMessage[];
}

export const conversationsApi = {
  list: async (): Promise<ChatConversation[]> => {
    const res = await api.get<{ data: ChatConversation[] }>(
      '/api/store/conversations?limit=30',
    );
    return res.data;
  },

  getMessages: async (conversationId: string): Promise<ConversationThread> => {
    const res = await api.get<{ data: ConversationThread }>(
      `/api/store/conversations/${conversationId}/messages`,
    );
    return res.data;
  },

  sendMessage: async (
    conversationId: string,
    content: string,
    type: 'TEXT' | 'OFFER' = 'TEXT',
  ): Promise<ChatMessage> => {
    const res = await api.post<{ data: ChatMessage }>(
      `/api/store/conversations/${conversationId}/messages`,
      { content, type },
    );
    return res.data;
  },

  markRead: async (conversationId: string): Promise<void> => {
    await api.patch<{ data: { success: boolean } }>(
      `/api/store/conversations/${conversationId}/read`,
    );
  },
};
