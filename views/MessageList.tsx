'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, MessagesSquare, Search, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useSocket } from '@/context/SocketContext';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  useConversationMessages,
  useConversations,
  useMarkConversationRead,
  useSendMessage,
} from '@/hooks/useConversations';
import type { ChatConversation, ChatMessage } from '@/lib/conversations-api';
import { formatFcfa } from '@/lib/format';
import { CONDITION_LABELS } from '@/lib/product-schema';
import { cn, getInitials } from '@/lib/utils';

const STOREFRONT_URL = process.env.NEXT_PUBLIC_STOREFRONT_URL ?? 'http://localhost:3000';

const MAX_MESSAGE_LENGTH = 500;
const PREVIEW_LENGTH = 45;

/** Même hauteur pour header gauche (titre + recherche) et header droit (produit). */
const PANEL_HEADER_CLASS =
  'flex h-[6.5rem] shrink-0 items-stretch border-b px-4';

const SCROLLBAR_HIDDEN =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden';

function conditionLabel(condition: string | null | undefined): string {
  if (!condition) return '';
  return CONDITION_LABELS[condition as keyof typeof CONDITION_LABELS] ?? condition;
}

/** "il y a 5 min", "2h", "3j" ou date courte. */
function relativeTime(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso).getTime();
  if (Number.isNaN(date)) return '';
  const diffMs = Date.now() - date;
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

/** Timestamp sous une bulle : heure si < 24h, sinon date + heure. */
function messageTime(iso: string): string {
  const date = new Date(iso);
  const time = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const diffMs = Date.now() - date.getTime();
  if (diffMs < 24 * 60 * 60 * 1000) return time;
  return `${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} · ${time}`;
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** "Aujourd'hui", "Hier" ou "12 juin". */
function dateSeparatorLabel(iso: string): string {
  const date = new Date(iso);
  const today = startOfDay(new Date());
  const day = startOfDay(date);
  const dayMs = 24 * 60 * 60 * 1000;
  if (day === today) return "Aujourd'hui";
  if (day === today - dayMs) return 'Hier';
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
}

function offerLabel(content: string): string {
  const digits = content.replace(/[^\d]/g, '');
  if (digits) return `Offre de ${Number(digits).toLocaleString('fr-FR')} FCFA`;
  return content || 'Offre';
}

function previewText(conversation: ChatConversation): string {
  const last = conversation.last_message;
  if (!last) return 'Aucun message';
  const raw = last.type === 'OFFER' ? `🏷️ ${offerLabel(last.content)}` : last.content;
  return raw.length > PREVIEW_LENGTH ? `${raw.slice(0, PREVIEW_LENGTH)}…` : raw;
}

function Avatar({ name, src, size = 'md' }: { name: string; src: string | null; size?: 'md' | 'sm' }) {
  const dimension = size === 'sm' ? 'size-8' : 'size-10';
  return (
    <div
      className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-medium text-foreground',
        dimension,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span>{getInitials(name)}</span>
      )}
    </div>
  );
}

function ConversationList({
  conversations,
  isLoading,
  selectedId,
  onSelect,
  search,
  onSearchChange,
}: {
  conversations: ChatConversation[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={cn(PANEL_HEADER_CLASS, 'flex-col justify-center gap-3')}>
        <h1 className="text-lg font-semibold leading-none">Messages</h1>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Rechercher un acheteur ou un produit…"
            className="h-9 pl-8"
          />
        </div>
      </div>

      <div className={cn('min-h-0 flex-1 overflow-y-auto', SCROLLBAR_HIDDEN)}>
        {isLoading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 rounded-lg p-2">
                <div className="size-10 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
            <MessagesSquare className="size-8 opacity-50" />
            <p className="text-sm">Aucune conversation</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1 p-2">
            {conversations.map((conversation) => {
              const isSelected = conversation.id === selectedId;
              const hasUnread = conversation.unread_count > 0;
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => onSelect(conversation.id)}
                  className={cn(
                    'w-full rounded-lg px-2.5 py-2.5 text-left ring-inset transition-colors',
                    isSelected ? 'bg-muted ring-1 ring-border' : 'hover:bg-muted/60',
                  )}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <Avatar name={conversation.counterpart.name} src={conversation.counterpart.avatar} />
                    <div className="w-0 flex-1 overflow-hidden">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            'truncate text-sm leading-5',
                            hasUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground',
                          )}
                        >
                          {conversation.counterpart.name}
                        </span>
                        <span className="shrink-0 text-nowrap text-xs text-muted-foreground">
                          {relativeTime(conversation.last_message_at ?? conversation.created_at)}
                        </span>
                      </div>
                      {conversation.product && (
                        <div className="truncate text-xs text-muted-foreground">
                          {conversation.product.title}
                        </div>
                      )}
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            'truncate text-xs',
                            hasUnread ? 'font-medium text-foreground' : 'text-muted-foreground',
                          )}
                        >
                          {previewText(conversation)}
                        </span>
                        {hasUnread && <span className="size-2.5 shrink-0 rounded-full bg-blue-500" />}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isOutbound = message.mine;

  if (message.type === 'OFFER') {
    return (
      <div className={cn('flex', isOutbound ? 'justify-end' : 'justify-start')}>
        <div className="flex max-w-md flex-col gap-1">
          <div
            className={cn(
              'flex items-center gap-2 rounded-xl border border-dashed px-4 py-3 text-sm font-medium',
              isOutbound ? 'border-primary/40 bg-primary/5' : 'border-border bg-muted',
            )}
          >
            <span aria-hidden>🏷️</span>
            <span>{offerLabel(message.content)}</span>
          </div>
          <span className={cn('text-xs text-muted-foreground', isOutbound && 'text-right')}>
            {messageTime(message.created_at)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex', isOutbound ? 'justify-end' : 'justify-start')}>
      <div className="flex max-w-md flex-col gap-1">
        <div
          className={cn(
            'rounded-xl px-4 py-2.5 text-sm leading-relaxed',
            isOutbound ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground',
          )}
        >
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
        <span className={cn('text-xs text-muted-foreground', isOutbound && 'text-right')}>
          {messageTime(message.created_at)}
        </span>
      </div>
    </div>
  );
}

function ConversationThreadPanel({
  conversation,
  onBack,
  showBackButton,
}: {
  conversation: ChatConversation;
  onBack: () => void;
  showBackButton: boolean;
}) {
  const { data, isLoading } = useConversationMessages(conversation.id);
  const sendMessage = useSendMessage(conversation.id);
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const messages = data?.messages ?? [];

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, conversation.id]);

  const handleSend = () => {
    const content = draft.trim();
    if (!content || sendMessage.isPending) return;
    sendMessage.mutate(content, {
      onSuccess: () => {
        setDraft('');
        requestAnimationFrame(() => {
          const el = scrollRef.current;
          if (el) el.scrollTop = el.scrollHeight;
        });
      },
    });
  };

  const product = conversation.product;
  const productUrl = product ? `${STOREFRONT_URL}/product/${product.id}` : null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={cn(PANEL_HEADER_CLASS, 'items-center gap-3')}>
        {showBackButton && (
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack} aria-label="Retour">
            <ArrowLeft className="size-4" />
          </Button>
        )}

        {product ? (
          <>
            {productUrl ? (
              <a
                href={productUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-14 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted"
              >
                {product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.image} alt={product.title} className="h-full w-full object-cover" />
                ) : (
                  <MessagesSquare className="size-4 text-muted-foreground/50" />
                )}
              </a>
            ) : (
              <div className="flex h-14 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                {product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.image} alt={product.title} className="h-full w-full object-cover" />
                ) : (
                  <MessagesSquare className="size-4 text-muted-foreground/50" />
                )}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {product.brand || product.title}
              </p>
              {conditionLabel(product.condition) && (
                <p className="truncate text-xs text-muted-foreground">
                  {conditionLabel(product.condition)}
                </p>
              )}
              {product.price != null && (
                <p className="text-xs font-semibold text-foreground">{formatFcfa(product.price)}</p>
              )}
            </div>
          </>
        ) : (
          <>
            <Avatar name={conversation.counterpart.name} src={conversation.counterpart.avatar} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{conversation.counterpart.name}</div>
              <div className="text-xs text-muted-foreground">Conversation</div>
            </div>
          </>
        )}
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className={cn('flex', index % 2 ? 'justify-end' : 'justify-start')}>
                <div className="h-10 w-48 animate-pulse rounded-xl bg-muted" />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Démarrez la conversation.
          </div>
        ) : (
          messages.map((message, index) => {
            const previous = messages[index - 1];
            const showSeparator =
              !previous || startOfDay(new Date(previous.created_at)) !== startOfDay(new Date(message.created_at));
            return (
              <div key={message.id} className="space-y-4">
                {showSeparator && (
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-border" />
                    <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                      {dateSeparatorLabel(message.created_at)}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                )}
                <MessageBubble message={message} />
              </div>
            );
          })
        )}
      </div>

      <Separator />
      <div className="p-3">
        <div className="flex items-end gap-2 rounded-lg border bg-background p-2">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value.slice(0, MAX_MESSAGE_LENGTH))}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
            placeholder="Écrivez votre message…"
            rows={1}
            maxLength={MAX_MESSAGE_LENGTH}
            className="max-h-[72px] min-h-9 resize-none overflow-y-auto border-0 px-1 py-1.5 text-sm shadow-none focus-visible:ring-0"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleSend}
            disabled={!draft.trim() || sendMessage.isPending}
            className="shrink-0"
          >
            <Send className="size-4" />
            Envoyer
          </Button>
        </div>
        <div className="mt-1 px-1 text-right text-xs text-muted-foreground">
          {draft.length}/{MAX_MESSAGE_LENGTH}
        </div>
      </div>
    </div>
  );
}

function EmptyThread() {
  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-3 p-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-muted">
        <MessagesSquare className="size-8 text-muted-foreground" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">Sélectionnez une conversation</p>
    </div>
  );
}

export default function MessageList() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const isMobile = useIsMobile();

  const { data: conversations = [], isLoading } = useConversations();
  const markRead = useMarkConversationRead();
  const { onMessage } = useSocket();

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((conversation) => {
      const name = conversation.counterpart.name.toLowerCase();
      const product = conversation.product?.title.toLowerCase() ?? '';
      return name.includes(query) || product.includes(query);
    });
  }, [conversations, search]);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) ?? null,
    [conversations, selectedId],
  );

  const handleSelect = (id: string) => {
    setSelectedId(id);
    markRead.mutate(id);
  };

  // Marquer comme lu et rester en bas dès qu'un message arrive sur la conversation active.
  useEffect(() => {
    const unsubscribe = onMessage((payload) => {
      if (payload.conversationId === selectedId) {
        markRead.mutate(payload.conversationId);
      }
    });
    return unsubscribe;
  }, [onMessage, selectedId, markRead]);

  const showThreadOnMobile = isMobile && !!selectedId;

  return (
    <div className="-m-4 flex h-[calc(100dvh-3rem)] overflow-hidden bg-background md:-m-6">
      <div
        className={cn(
          'w-full shrink-0 border-r md:w-[22.5rem] lg:w-[35%]',
          showThreadOnMobile ? 'hidden md:block' : 'block',
        )}
      >
        <ConversationList
          conversations={filtered}
          isLoading={isLoading}
          selectedId={selectedId}
          onSelect={handleSelect}
          search={search}
          onSearchChange={setSearch}
        />
      </div>

      <div className={cn('min-w-0 flex-1', showThreadOnMobile ? 'block' : 'hidden md:block')}>
        {activeConversation ? (
          <ConversationThreadPanel
            key={activeConversation.id}
            conversation={activeConversation}
            onBack={() => setSelectedId(null)}
            showBackButton={isMobile}
          />
        ) : (
          <EmptyThread />
        )}
      </div>
    </div>
  );
}
