'use client';

import { useMemo } from 'react';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';

function preventPaginationNavigation(event: React.MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
}

type TablePaginationFooterProps = {
  visibleCount: number;
  total: number;
  entityLabel: string;
  pageIndex: number;
  pageCount: number;
  onPageChange: (pageIndex: number) => void;
  className?: string;
};

export function TablePaginationFooter({
  visibleCount,
  total,
  entityLabel,
  pageIndex,
  pageCount,
  onPageChange,
  className,
}: TablePaginationFooterProps) {
  const currentPage = pageIndex + 1;
  const canPrevious = pageIndex > 0;
  const canNext = pageIndex < pageCount - 1;

  const pageNumbers = useMemo(() => {
    if (pageCount <= 3) return Array.from({ length: pageCount }, (_, index) => index + 1);
    if (currentPage <= 2) return [1, 2, 3];
    if (currentPage >= pageCount - 1) return [pageCount - 2, pageCount - 1, pageCount];
    return [currentPage - 1, currentPage, currentPage + 1];
  }, [currentPage, pageCount]);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-between gap-4 px-4 pb-1 sm:flex-row md:px-6',
        className,
      )}
    >
      <p className="text-muted-foreground text-sm">
        Affichage de {visibleCount} sur {total.toLocaleString('fr-FR')} {entityLabel}
      </p>

      <Pagination className="mx-0 w-auto justify-end">
        <PaginationContent className="gap-1.5">
          <PaginationItem>
            <PaginationPrevious
              href="#"
              className={!canPrevious ? 'pointer-events-none opacity-50' : undefined}
              onClick={(event) => {
                preventPaginationNavigation(event);
                onPageChange(pageIndex - 1);
              }}
            />
          </PaginationItem>
          {pageNumbers[0] > 1 ? (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          ) : null}
          {pageNumbers.map((pageNumber) => (
            <PaginationItem key={`page-${pageNumber}`}>
              <PaginationLink
                href="#"
                isActive={pageIndex === pageNumber - 1}
                onClick={(event) => {
                  preventPaginationNavigation(event);
                  onPageChange(pageNumber - 1);
                }}
              >
                {pageNumber}
              </PaginationLink>
            </PaginationItem>
          ))}
          {pageNumbers[pageNumbers.length - 1] < pageCount ? (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          ) : null}
          <PaginationItem>
            <PaginationNext
              href="#"
              className={!canNext ? 'pointer-events-none opacity-50' : undefined}
              onClick={(event) => {
                preventPaginationNavigation(event);
                onPageChange(pageIndex + 1);
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
