'use client';

import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';

interface TruncatedHoverTextProps {
  text: string | null | undefined;
  emptyLabel?: string;
  className?: string;
}

export function TruncatedHoverText({
  text,
  emptyLabel = '—',
  className,
}: TruncatedHoverTextProps) {
  const value = text?.trim() ?? '';

  if (!value) {
    return <span className="text-muted-foreground">{emptyLabel}</span>;
  }

  return (
    <HoverCard openDelay={150} closeDelay={80}>
      <HoverCardTrigger asChild>
        <span
          className={cn(
            'block w-full min-w-0 cursor-default truncate outline-none',
            className,
          )}
        >
          {value}
        </span>
      </HoverCardTrigger>
      <HoverCardContent
        align="start"
        side="top"
        className="z-[100] w-auto max-w-sm p-2.5 text-sm"
      >
        <p className="lowercase leading-snug break-words">{value}</p>
      </HoverCardContent>
    </HoverCard>
  );
}
