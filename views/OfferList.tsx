'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Image as ImageIcon, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';

import CounterOfferModal from '@/components/offers/CounterOfferModal';
import { TruncatedHoverText } from '@/components/offers/TruncatedHoverText';
import ConfirmModal from '@/components/products/ConfirmModal';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { TablePaginationFooter } from '@/components/ui/table-pagination-footer';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useAcceptOffer,
  useCounterOffer,
  useDeclineOffer,
  useOffers,
} from '@/hooks/useOffers';
import type { OfferStatus, VendorOffer } from '@/lib/types';

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'ALL', label: 'Toutes' },
  { value: 'PENDING', label: 'En attente' },
  { value: 'ACCEPTED', label: 'Acceptées' },
  { value: 'DECLINED', label: 'Refusées' },
  { value: 'COUNTER', label: 'Contre-offres' },
  { value: 'EXPIRED', label: 'Expirées' },
];

const STATUS_LABELS: Record<OfferStatus, string> = {
  PENDING: 'En attente',
  ACCEPTED: 'Acceptée',
  DECLINED: 'Refusée',
  COUNTER: 'Contre-offre envoyée',
  EXPIRED: 'Expirée',
};

function statusBadgeClass(status: OfferStatus): string {
  switch (status) {
    case 'PENDING':
      return 'border-transparent bg-yellow-500/15 text-yellow-800 dark:text-yellow-300';
    case 'ACCEPTED':
      return 'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
    case 'DECLINED':
      return 'border-transparent bg-red-500/15 text-red-700 dark:text-red-300';
    case 'COUNTER':
      return 'border-transparent bg-blue-500/15 text-blue-700 dark:text-blue-300';
    case 'EXPIRED':
      return 'border-transparent bg-slate-500/15 text-slate-600 dark:text-slate-400';
    default:
      return 'border-transparent';
  }
}

function formatGapPercent(offerAmount: number, initialPrice: number): string {
  if (initialPrice <= 0) return '—';
  const gap = ((initialPrice - offerAmount) / initialPrice) * 100;
  return `${gap.toFixed(1)} %`;
}

type ConfirmAction = 'accept' | 'decline';

function OfferActionsMenu({
  offer,
  disabled,
  onAccept,
  onDecline,
  onCounter,
}: {
  offer: VendorOffer;
  disabled?: boolean;
  onAccept: (offer: VendorOffer) => void;
  onDecline: (offer: VendorOffer) => void;
  onCounter: (offer: VendorOffer) => void;
}) {
  const isPending = offer.status === 'PENDING';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="size-8 shrink-0 p-0" disabled={disabled}>
          <span className="sr-only">Ouvrir le menu</span>
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isPending ? (
          <>
            <DropdownMenuItem
              disabled={disabled}
              onSelect={(e) => {
                e.preventDefault();
                onAccept(offer);
              }}
            >
              Accepter
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={disabled}
              onSelect={(e) => {
                e.preventDefault();
                onDecline(offer);
              }}
            >
              Refuser
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={disabled}
              onSelect={(e) => {
                e.preventDefault();
                onCounter(offer);
              }}
            >
              Contre-offre
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem disabled>Aucune action</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function OfferProductPhoto({ url }: { url: string | null }) {
  return (
    <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <ImageIcon className="size-4 text-muted-foreground/50" />
      )}
    </div>
  );
}

export default function OfferList() {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [confirmTarget, setConfirmTarget] = useState<{
    offer: VendorOffer;
    action: ConfirmAction;
  } | null>(null);
  const [counterTarget, setCounterTarget] = useState<VendorOffer | null>(null);

  const limit = 20;

  const { data, isLoading, isError } = useOffers({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    page,
    limit,
  });

  const acceptMutation = useAcceptOffer();
  const declineMutation = useDeclineOffer();
  const counterMutation = useCounterOffer();

  const offers = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total ?? offers.length;

  const confirmLoading =
    confirmTarget?.action === 'accept' ? acceptMutation.isPending : declineMutation.isPending;

  const actionsDisabled =
    acceptMutation.isPending || declineMutation.isPending || counterMutation.isPending;

  const openAccept = (offer: VendorOffer) => setConfirmTarget({ offer, action: 'accept' });
  const openDecline = (offer: VendorOffer) => setConfirmTarget({ offer, action: 'decline' });
  const openCounter = (offer: VendorOffer) => setCounterTarget(offer);

  const columns = useMemo<ColumnDef<VendorOffer>[]>(
    () => [
      {
        accessorKey: 'product.image',
        header: 'Photo',
        cell: ({ row }) => <OfferProductPhoto url={row.original.product.image} />,
      },
      {
        accessorKey: 'product.title',
        header: 'Titre produit',
        cell: ({ row }) => (
          <div className="max-w-[220px]">
            <TruncatedHoverText text={row.original.product.title} className="font-medium" />
          </div>
        ),
      },
      {
        accessorKey: 'buyer_name',
        header: 'Acheteur',
        cell: ({ row }) => (
          <div className="max-w-[160px]">
            <TruncatedHoverText text={row.original.buyer_name} />
          </div>
        ),
      },
      {
        accessorKey: 'amount',
        header: 'Montant offert',
        cell: ({ row }) => (
          <span className="tabular-nums font-medium">
            {row.original.amount.toLocaleString('fr-FR')} FCFA
          </span>
        ),
      },
      {
        id: 'initial_price',
        header: 'Prix initial',
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {row.original.product.price.toLocaleString('fr-FR')} FCFA
          </span>
        ),
      },
      {
        id: 'gap',
        header: 'Écart (%)',
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {formatGapPercent(row.original.amount, row.original.product.price)}
          </span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Statut',
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge variant="outline" className={statusBadgeClass(status)}>
              {STATUS_LABELS[status]}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Date',
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            {format(new Date(row.original.created_at), 'dd MMM yyyy', { locale: fr })}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <OfferActionsMenu
              offer={row.original}
              disabled={actionsDisabled}
              onAccept={openAccept}
              onDecline={openDecline}
              onCounter={openCounter}
            />
          </div>
        ),
      },
    ],
    [actionsDisabled],
  );

  const table = useReactTable({
    data: offers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <div className="min-w-0 space-y-4">
      <div className="min-w-0">
        <h1 className="font-serif text-2xl font-semibold tracking-tight">Mes offres reçues</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Consultez et répondez aux offres de prix proposées par les acheteurs.
        </p>
      </div>

      <Card className="min-w-0 shadow-none">
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
            <Table className="min-w-[1080px] **:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4 **:data-[slot='table-cell']:py-4">
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
                      Impossible de charger les offres.
                    </TableCell>
                  </TableRow>
                ) : table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
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
                      Aucune offre trouvée.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <TablePaginationFooter
            visibleCount={offers.length}
            total={total}
            entityLabel="offres"
            pageIndex={page - 1}
            pageCount={Math.max(totalPages, 1)}
            onPageChange={(pageIndex) => setPage(pageIndex + 1)}
          />
        </CardContent>
      </Card>

      <ConfirmModal
        open={Boolean(confirmTarget)}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
        title={
          confirmTarget?.action === 'accept'
            ? 'Accepter cette offre ?'
            : 'Refuser cette offre ?'
        }
        description={
          confirmTarget
            ? confirmTarget.action === 'accept'
              ? `Vous acceptez l'offre de ${confirmTarget.offer.amount.toLocaleString('fr-FR')} FCFA pour « ${confirmTarget.offer.product.title} ».`
              : `Vous refusez l'offre de ${confirmTarget.offer.amount.toLocaleString('fr-FR')} FCFA pour « ${confirmTarget.offer.product.title} ».`
            : ''
        }
        confirmLabel={confirmTarget?.action === 'accept' ? 'Accepter' : 'Refuser'}
        destructive={confirmTarget?.action === 'decline'}
        loading={confirmLoading}
        onConfirm={() => {
          if (!confirmTarget) return;
          const { offer, action } = confirmTarget;
          const mutation = action === 'accept' ? acceptMutation : declineMutation;
          mutation.mutate(offer.id, {
            onSuccess: () => {
              toast.success(action === 'accept' ? 'Offre acceptée' : 'Offre refusée');
              setConfirmTarget(null);
            },
            onError: (err) => toast.error(err.message),
          });
        }}
      />

      <CounterOfferModal
        offer={counterTarget}
        open={Boolean(counterTarget)}
        onOpenChange={(open) => !open && setCounterTarget(null)}
        loading={counterMutation.isPending}
        onSubmit={(counterAmount) => {
          if (!counterTarget) return;
          counterMutation.mutate(
            { offerId: counterTarget.id, counter_amount: counterAmount },
            {
              onSuccess: () => {
                toast.success('Contre-offre envoyée');
                setCounterTarget(null);
              },
              onError: (err) => toast.error(err.message),
            },
          );
        }}
      />
    </div>
  );
}
