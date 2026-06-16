'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Eye,
  EyeOff,
  Image as ImageIcon,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

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
import { Input } from '@/components/ui/input';
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
import {
  useDeleteProduct,
  useProducts,
  useStoreCategories,
  useToggleProduct,
} from '@/hooks/useProducts';
import {
  STATUS_LABELS,
  statusBadgeClass,
  type ProductStatus,
} from '@/lib/product-schema';
import type { VendorProduct } from '@/lib/types';

function preventPaginationNavigation(event: React.MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
}

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'ACTIVE', label: STATUS_LABELS.ACTIVE },
  { value: 'DRAFT', label: STATUS_LABELS.DRAFT },
  { value: 'PENDING_REVIEW', label: STATUS_LABELS.PENDING_REVIEW },
  { value: 'ARCHIVED', label: STATUS_LABELS.ARCHIVED },
];

export default function ProductList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<VendorProduct | null>(null);

  const limit = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: categories = [] } = useStoreCategories();
  const { data, isLoading, isError } = useProducts({
    search: debouncedSearch || undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    category_id: categoryFilter === 'all' ? undefined : categoryFilter,
    page,
    limit,
  });

  const toggleMutation = useToggleProduct();
  const deleteMutation = useDeleteProduct();

  const products = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total ?? 0;

  const columns = useMemo<ColumnDef<VendorProduct>[]>(
    () => [
      {
        accessorKey: 'primary_image',
        header: 'Photo',
        cell: ({ row }) => {
          const url = row.original.primary_image;
          return (
            <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-md border bg-muted">
              {url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="size-6 text-muted-foreground/50" />
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'title',
        header: 'Titre',
        cell: ({ row }) => (
          <span className="font-medium line-clamp-2 max-w-[220px]">{row.original.title}</span>
        ),
      },
      {
        accessorKey: 'category_name',
        header: 'Catégorie',
        cell: ({ row }) => row.original.category_name || '—',
      },
      {
        accessorKey: 'price',
        header: 'Prix FCFA',
        cell: ({ row }) => (
          <span className="tabular-nums font-medium">
            {Number(row.original.price).toLocaleString('fr-FR')} FCFA
          </span>
        ),
      },
      {
        accessorKey: 'stock',
        header: 'Stock',
        cell: ({ row }) => {
          const stock = row.original.stock;
          const isLow = stock <= 2;
          return (
            <Badge
              variant="outline"
              className={
                isLow
                  ? 'border-transparent bg-red-500/15 text-red-700 dark:text-red-400'
                  : 'border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
              }
            >
              {stock}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Statut',
        cell: ({ row }) => {
          const status = row.original.status as ProductStatus;
          return (
            <Badge variant="outline" className={statusBadgeClass(status)}>
              {STATUS_LABELS[status] ?? status}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'views_count',
        header: 'Vues',
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {row.original.views_count ?? 0}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const product = row.original;
          const canToggle = product.status === 'ACTIVE' || product.status === 'DRAFT';
          const isActive = product.status === 'ACTIVE';

          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="size-8 p-0">
                    <span className="sr-only">Ouvrir le menu</span>
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/products/${product.id}/edit`}>
                      
                      Modifier
                    </Link>
                  </DropdownMenuItem>
                  {canToggle && (
                    <DropdownMenuItem
                      disabled={toggleMutation.isPending}
                      onSelect={(e) => {
                        e.preventDefault();
                        toggleMutation.mutate(product.id, {
                          onSuccess: () => {
                            toast.success(isActive ? 'Produit désactivé' : 'Produit activé');
                          },
                          onError: (err) => toast.error(err.message),
                        });
                      }}
                    >
                      
                      {isActive ? 'Désactiver' : 'Activer'}
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={(e) => {
                      e.preventDefault();
                      setDeleteTarget(product);
                    }}
                  >
                    
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [toggleMutation],
  );

  const table = useReactTable({
    data: products,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
    manualPagination: true,
    pageCount: totalPages,
  });

  const pageNumbers = useMemo(() => {
    if (totalPages <= 3) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (page <= 2) return [1, 2, 3];
    if (page >= totalPages - 1) return [totalPages - 2, totalPages - 1, totalPages];
    return [page - 1, page, page + 1];
  }, [page, totalPages]);

  const startIndex = total === 0 ? 0 : (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, total);

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-serif text-2xl font-semibold tracking-tight">Produits</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gérez votre inventaire, ajoutez de nouveaux produits et mettez à jour les stocks.
          </p>
        </div>
        <Button asChild className="shrink-0 self-start sm:self-center">
          <Link href="/products/new">
            <Plus className="mr-2 size-4" />
            Ajouter un produit
          </Link>
        </Button>
      </div>

      <Card className="min-w-0 overflow-hidden shadow-none">
        <CardHeader>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <div className="relative min-w-0 w-full sm:w-44 md:w-64">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                className="h-9 w-full pl-8"
                placeholder="Rechercher…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-full sm:w-44">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {categories.length > 0 && (
              <Select
                value={categoryFilter}
                onValueChange={(v) => {
                  setCategoryFilter(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-9 w-full sm:w-44">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex min-w-0 flex-col gap-4 px-0">
          <div className="min-w-0 overflow-x-auto px-6 [&_[data-slot=table-container]]:overflow-visible">
            <Table className="**:data-[slot='table-cell']:px-4 **:data-[slot='table-head']:px-4 **:data-[slot='table-cell']:py-4 **:data-[slot='table-cell']:first:pl-0 **:data-[slot='table-head']:first:pl-0 **:data-[slot='table-cell']:last:pr-0 **:data-[slot='table-head']:last:pr-0">
              <TableHeader className="border-t bg-muted/20 **:data-[slot='table-head']:h-11 **:data-[slot='table-head']:text-sm **:data-[slot='table-head']:font-medium **:data-[slot='table-head']:text-foreground">
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
                      Impossible de charger les produits.
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
                      Aucun produit trouvé.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col items-center justify-between gap-4 px-6 pb-2 pt-2 sm:flex-row">
            <p className="text-sm text-muted-foreground">
              {total > 0 ? (
                <>Affichage {startIndex}-{endIndex} sur {total} produits</>
              ) : (
                <>Aucun produit</>
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

      <ConfirmModal
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Supprimer ce produit ?"
        description={`« ${deleteTarget?.title ?? ''} » sera archivé et ne sera plus visible sur la boutique.`}
        confirmLabel="Supprimer"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleteTarget) return;
          deleteMutation.mutate(deleteTarget.id, {
            onSuccess: () => {
              toast.success('Produit archivé');
              setDeleteTarget(null);
            },
            onError: (err) => toast.error(err.message),
          });
        }}
      />
    </div>
  );
}
