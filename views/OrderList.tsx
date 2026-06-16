'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNowStrict } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useOrderDetail, useOrders } from '@/hooks/useOrders';
import { ORDER_STATUS_LABELS } from '@/lib/order-utils';
import type { OrderStatus, VendorOrder } from '@/lib/types';

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'Toutes' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'CONFIRMED', label: 'Confirmées' },
  { value: 'PREPARING', label: 'En préparation' },
  { value: 'SHIPPED', label: 'Expédiées' },
  { value: 'DELIVERED', label: 'Livrées' },
];

function preventPaginationNavigation(event: React.MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
}

function isPendingOver24h(order: VendorOrder): boolean {
  if (order.status !== 'PENDING') return false;
  const created = new Date(order.created_at).getTime();
  if (Number.isNaN(created)) return false;
  return Date.now() - created > 24 * 60 * 60 * 1000;
}

function rowAlertClass(order: VendorOrder): string | undefined {
  if (!isPendingOver24h(order)) return undefined;
  const age = Date.now() - new Date(order.created_at).getTime();
  return age > 48 * 60 * 60 * 1000
    ? 'bg-red-500/10 hover:bg-red-500/15'
    : 'bg-orange-500/10 hover:bg-orange-500/15';
}

function statusBadgeClass(status: OrderStatus): string {
  switch (status) {
    case 'PENDING':
      return 'border-transparent bg-orange-500/15 text-orange-700 dark:text-orange-300';
    case 'CONFIRMED':
    case 'PREPARING':
      return 'border-transparent bg-blue-500/15 text-blue-700 dark:text-blue-300';
    case 'SHIPPED':
      return 'border-transparent bg-violet-500/15 text-violet-700 dark:text-violet-300';
    case 'DELIVERED':
      return 'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
    case 'CANCELLED':
    case 'RETURNED':
      return 'border-transparent bg-red-500/15 text-red-700 dark:text-red-300';
    default:
      return 'border-transparent';
  }
}

function OrderItemsPreview({ orderId, itemsCount }: { orderId: string; itemsCount: number }) {
  const { data } = useOrderDetail(orderId);
  const images = (data?.data.items ?? [])
    .map((item) => item.product_snapshot.image)
    .filter((img): img is string => Boolean(img))
    .slice(0, 3);

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {images.length > 0 ? (
          images.map((img, index) => (
            <div
              key={`${orderId}-${index}`}
              className="size-9 overflow-hidden rounded-full border bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" className="h-full w-full object-cover" />
            </div>
          ))
        ) : (
          <div className="size-9 rounded-full border bg-muted" />
        )}
      </div>
      <span className="text-sm text-muted-foreground">{itemsCount} article(s)</span>
    </div>
  );
}

export default function OrderList() {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading, isError } = useOrders({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    page,
    limit,
  });

  const orders = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total ?? 0;

  const columns = useMemo<ColumnDef<VendorOrder>[]>(
    () => [
      {
        id: 'id',
        header: 'N° commande',
        cell: ({ row }) => (
          <span className="font-medium text-primary">#{row.original.id.slice(0, 8).toUpperCase()}</span>
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Date',
        cell: ({ row }) => {
          const d = new Date(row.original.created_at);
          if (Number.isNaN(d.getTime())) return '—';
          return (
            <div className="text-sm">
              <p>{d.toLocaleDateString('fr-FR')}</p>
              <p className="text-muted-foreground">
                {formatDistanceToNowStrict(d, { addSuffix: true, locale: fr })}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: 'buyer_name',
        header: 'Acheteur',
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.buyer_name}</p>
            <p className="text-xs text-muted-foreground">{row.original.shipping_address.phone}</p>
          </div>
        ),
      },
      {
        id: 'items',
        header: 'Articles',
        cell: ({ row }) => (
          <OrderItemsPreview orderId={row.original.id} itemsCount={row.original.items_count} />
        ),
      },
      {
        accessorKey: 'total_amount',
        header: 'Total',
        cell: ({ row }) => (
          <span className="font-medium">{Number(row.original.total_amount).toLocaleString('fr-FR')} FCFA</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Statut',
        cell: ({ row }) => (
          <Badge variant="outline" className={statusBadgeClass(row.original.status)}>
            {ORDER_STATUS_LABELS[row.original.status]}
          </Badge>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Action</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="size-8 p-0">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/orders/${row.original.id}`}>Voir détails</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    manualPagination: true,
    pageCount: totalPages,
  });

  const pageNumbers = useMemo(() => {
    if (totalPages <= 3) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 2) return [1, 2, 3];
    if (page >= totalPages - 1) return [totalPages - 2, totalPages - 1, totalPages];
    return [page - 1, page, page + 1];
  }, [page, totalPages]);

  const startIndex = total === 0 ? 0 : (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, total);

  return (
    <div className="min-w-0 space-y-4">
      <div className="min-w-0">
        <h1 className="font-serif text-2xl font-semibold tracking-tight">Commandes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Suivez les commandes et mettez a jour leur statut de traitement.
        </p>
      </div>

      <Card className="min-w-0 overflow-hidden shadow-none">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-full sm:w-56">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="flex min-w-0 flex-col gap-4 px-0">
          <div className="min-w-0 overflow-x-auto px-6">
            <Table className="**:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4 **:data-[slot='table-cell']:py-4">
              <TableHeader className="border-t bg-muted/20 **:data-[slot='table-head']:h-11 **:data-[slot='table-head']:text-sm **:data-[slot='table-head']:font-medium">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`sk-${i}`}>
                      {columns.map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-8 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-32 text-center text-destructive">
                      Impossible de charger les commandes.
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} className={rowAlertClass(row.original)}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                      Aucune commande trouvee.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 px-6 pb-2 pt-2 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              {total > 0 ? (
                <>Affichage {startIndex}-{endIndex} sur {total} commandes</>
              ) : (
                <>Aucune commande</>
              )}
            </p>

            {totalPages > 1 && (
              <Pagination className="mx-0 w-auto justify-end">
                <PaginationContent className="gap-1.5">
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      className={page <= 1 ? 'pointer-events-none opacity-50' : undefined}
                      onClick={(e) => {
                        preventPaginationNavigation(e);
                        setPage((p) => Math.max(1, p - 1));
                      }}
                    />
                  </PaginationItem>
                  {pageNumbers[0] > 1 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  {pageNumbers.map((n) => (
                    <PaginationItem key={n}>
                      <PaginationLink
                        href="#"
                        isActive={page === n}
                        onClick={(e) => {
                          preventPaginationNavigation(e);
                          setPage(n);
                        }}
                      >
                        {n}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  {pageNumbers[pageNumbers.length - 1] < totalPages && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      className={page >= totalPages ? 'pointer-events-none opacity-50' : undefined}
                      onClick={(e) => {
                        preventPaginationNavigation(e);
                        setPage((p) => Math.min(totalPages, p + 1));
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
