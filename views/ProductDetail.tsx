'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Eye, Image as ImageIcon, MoreHorizontal, Package } from 'lucide-react';
import { toast } from 'sonner';

import ConfirmModal from '@/components/products/ConfirmModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useDeleteProduct, useProduct, useStoreCategories, useToggleProduct } from '@/hooks/useProducts';
import { findCategoryById, type StoreCategory } from '@/lib/categories';
import { formatViews } from '@/lib/utils';
import { formatFcfa } from '@/lib/format';
import {
  CONDITION_LABELS,
  STATUS_LABELS,
  statusBadgeClass,
  type ProductStatus,
} from '@/lib/product-schema';
import type { VendorProductImage } from '@/lib/types';

interface ProductDetailProps {
  productId: string;
}

function conditionLabel(condition: string | null | undefined): string {
  if (!condition) return '—';
  return CONDITION_LABELS[condition as keyof typeof CONDITION_LABELS] ?? condition;
}

function formatDate(iso: string | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatSpecValue(value: React.ReactNode): React.ReactNode {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') return Number.isNaN(value) ? '—' : value;
  if (typeof value === 'string' && value.trim() === '') return '—';
  return value;
}

function SpecCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="break-words text-sm font-medium text-foreground">{formatSpecValue(value)}</p>
    </div>
  );
}

function resolveCategoryLabel(
  categoryName: string | null | undefined,
  categoryId: string | null | undefined,
  categories: StoreCategory[],
): string {
  if (categoryName?.trim()) return categoryName;

  if (!categoryId || categories.length === 0) return '—';

  for (const root of categories) {
    if (root.id === categoryId) return root.name;
    const child = root.children.find((c) => c.id === categoryId);
    if (child) return `${root.name} › ${child.name}`;
  }

  const found = findCategoryById(categories, categoryId);
  return found?.name ?? '—';
}

export default function ProductDetail({ productId }: ProductDetailProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: categories = [] } = useStoreCategories();
  const { data, isLoading, isError } = useProduct(productId);
  const toggleMutation = useToggleProduct();
  const deleteMutation = useDeleteProduct();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const product = data?.data;

  const sortedImages = useMemo<VendorProductImage[]>(() => {
    if (!product?.images?.length) return [];
    return [...product.images].sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
      return a.position - b.position;
    });
  }, [product?.images]);

  const primaryUrl =
    selectedImage ??
    product?.images?.find((img) => img.is_primary)?.url ??
    sortedImages[0]?.url ??
    null;

  const categoryLabel = useMemo(
    () =>
      product
        ? resolveCategoryLabel(product.category_name, product.category_id, categories)
        : '—',
    [product, categories],
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-5 w-48" />
        <div className="grid gap-8 lg:grid-cols-[45%_55%]">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/products">Retour aux produits</Link>
        </Button>
        <p className="text-sm text-destructive">Produit introuvable ou accès refusé.</p>
      </div>
    );
  }

  const status = product.status as ProductStatus;
  const canToggle = status === 'ACTIVE' || status === 'DRAFT';
  const isActive = status === 'ACTIVE';

  const handleToggle = () => {
    toggleMutation.mutate(product.id, {
      onSuccess: () => {
        toast.success(isActive ? 'Produit désactivé' : 'Produit activé');
        queryClient.invalidateQueries({ queryKey: ['vendor', 'products', product.id] });
      },
      onError: (err) => toast.error(err.message),
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate(product.id, {
      onSuccess: () => {
        toast.success('Produit archivé');
        setConfirmDelete(false);
        router.push('/products');
      },
      onError: (err) => toast.error(err.message),
    });
  };

  return (
    <div className="min-w-0 space-y-6">
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/products" className="hover:text-foreground hover:underline">
          Mes produits
        </Link>
        <span>›</span>
        <span className="truncate font-medium text-foreground">{product.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[45%_55%]">
        {/* Colonne gauche — galerie */}
        <div className="min-w-0 space-y-3">
          <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border bg-muted">
            {primaryUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={primaryUrl} alt={product.title} className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="size-12 text-muted-foreground/40" />
            )}
          </div>

          {sortedImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {sortedImages.map((img) => {
                const active = primaryUrl === img.url;
                return (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setSelectedImage(img.url)}
                    className={`relative size-20 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                      active ? 'border-foreground' : 'border-transparent hover:border-border'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Colonne droite — informations */}
        <div className="min-w-0 space-y-5 pr-2 sm:pr-4 lg:pr-6">
          <div className="space-y-3">
            <div className="flex items-start gap-4">
              <h1 className="min-w-0 flex-1 font-serif text-2xl font-semibold tracking-tight">
                {product.title}
              </h1>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="size-8 shrink-0 p-0">
                    <span className="sr-only">Ouvrir le menu</span>
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`/products/${product.id}/edit`}>Modifier</Link>
                  </DropdownMenuItem>
                  {canToggle && (
                    <DropdownMenuItem
                      disabled={toggleMutation.isPending}
                      onSelect={(e) => {
                        e.preventDefault();
                        handleToggle();
                      }}
                    >
                      {isActive ? 'Désactiver' : 'Activer'}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={(e) => {
                      e.preventDefault();
                      setConfirmDelete(true);
                    }}
                  >
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={statusBadgeClass(status)}>
                {STATUS_LABELS[status] ?? status}
              </Badge>
              <Badge variant="outline" className="border-transparent bg-muted text-muted-foreground">
                {conditionLabel(product.condition)}
              </Badge>
            </div>
          </div>

          <p className="text-3xl font-semibold tabular-nums">{formatFcfa(product.price)}</p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-5">
            <SpecCell label="Catégorie" value={categoryLabel} />
            <SpecCell label="Marque" value={product.brand} />
            <SpecCell label="Taille" value={product.size} />
            <SpecCell label="Couleur" value={product.color} />
            <SpecCell label="Matière" value={product.material} />
            <SpecCell label="Stock disponible" value={product.stock ?? 0} />
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">Description</h2>
            {product.description?.trim() ? (
              <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {product.description}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Aucune description.</p>
            )}
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Eye className="size-4" />
              Vues :{' '}
              <span
                className="font-medium text-foreground"
                title={`${(product.views_count ?? 0).toLocaleString('fr-FR')} vues au total`}
              >
                {formatViews(product.views_count ?? 0)}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Package className="size-4" />
              Commandes :{' '}
              <span className="font-medium text-foreground">{product.orders_count ?? 0}</span>
            </span>
            <span className="text-muted-foreground">
              Ajouté le : <span className="font-medium text-foreground">{formatDate(product.created_at)}</span>
            </span>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Supprimer ce produit ?"
        description={`« ${product.title} » sera archivé et ne sera plus visible sur la boutique.`}
        confirmLabel="Supprimer"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
