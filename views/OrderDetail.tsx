'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useOrderDetail, useUpdateOrderStatus } from '@/hooks/useOrders';
import { ORDER_STATUS_LABELS } from '@/lib/order-utils';
import type { OrderStatus } from '@/lib/types';

interface OrderDetailProps {
  orderId: string;
}

const NEXT_TRANSITION: Record<OrderStatus, { next: OrderStatus; cta: string } | null> = {
  PENDING: { next: 'CONFIRMED', cta: 'Confirmer la commande' },
  CONFIRMED: { next: 'PREPARING', cta: 'Marquer en preparation' },
  PREPARING: { next: 'SHIPPED', cta: 'Marquer comme expediee' },
  SHIPPED: { next: 'DELIVERED', cta: 'Marquer comme livree' },
  DELIVERED: null,
  CANCELLED: null,
  RETURNED: null,
};

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

export default function OrderDetail({ orderId }: OrderDetailProps) {
  const [note, setNote] = useState('');
  const { data, isLoading, isError } = useOrderDetail(orderId);
  const mutation = useUpdateOrderStatus(orderId);

  const order = data?.data;
  const nextAction = order ? NEXT_TRANSITION[order.status] : null;

  const itemsTotal = useMemo(() => {
    if (!order) return 0;
    return order.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  }, [order]);

  const handleStatusUpdate = async () => {
    if (!order || !nextAction) return;
    try {
      await mutation.mutateAsync({ status: nextAction.next, note: note || undefined });
      toast.success('Statut de commande mis a jour');
      setNote('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Echec de la mise a jour');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="space-y-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/orders">
            <ArrowLeft className="mr-2 size-4" />
            Retour aux commandes
          </Link>
        </Button>
        <p className="text-sm text-destructive">Impossible de charger le detail de la commande.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
        <Link href="/orders">
          <ArrowLeft className="mr-2 size-4" />
          Retour aux commandes
        </Link>
      </Button>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-4 lg:pr-6">
          <div className="border-b border-gray-200 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-serif text-2xl font-semibold">
                Commande #{order.id.slice(0, 8).toUpperCase()}
              </h1>
              <Badge variant="outline" className={statusBadgeClass(order.status)}>
                {ORDER_STATUS_LABELS[order.status]}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Creee le {new Date(order.created_at).toLocaleString('fr-FR')}
            </p>
          </div>

          <div className="flex items-center justify-between border-b border-gray-200 pb-2 text-sm text-muted-foreground">
            <span>Articles commandes</span>
            <span>{order.items.length} article(s)</span>
          </div>

          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 py-2">
                <div className="size-16 shrink-0 overflow-hidden bg-muted">
                  {item.product_snapshot.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.product_snapshot.image}
                      alt={item.product_snapshot.title}
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{item.product_snapshot.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Quantite: {item.quantity} · Prix unitaire: {item.unit_price.toLocaleString('fr-FR')} FCFA
                  </p>
                </div>
                <p className="shrink-0 text-sm font-medium sm:text-base">
                  {(item.unit_price * item.quantity).toLocaleString('fr-FR')} FCFA
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full space-y-5 border-t border-gray-200 pt-5 lg:w-[380px] lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div className="space-y-2 text-sm">
            <h2 className="pb-2 text-base font-semibold text-foreground">Informations livraison</h2>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Nom</span>
              <span className="font-medium text-right">
                {order.shipping_address.first_name} {order.shipping_address.last_name}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Telephone</span>
              <span className="font-medium text-right">{order.shipping_address.phone}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Adresse</span>
              <span className="max-w-[220px] text-right font-medium">
                {order.shipping_address.notes || 'Non precisee'}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Region</span>
              <span className="font-medium text-right">{order.shipping_region_id}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Methode</span>
              <span className="font-medium text-right">
                {order.shipping_method === 'PER_KM' ? 'Par km' : 'Fixe'}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Frais livraison</span>
              <span className="font-medium text-right">
                {order.shipping_fee.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
            <div className="flex justify-between gap-3 border-t border-gray-200 pt-2">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold text-right">
                {(itemsTotal + order.shipping_fee).toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>

          <div className="space-y-3 border-t border-gray-200 pt-4">
            <h2 className="text-base font-semibold text-foreground">Changement de statut</h2>
            {nextAction ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="status-note">Note pour le client (optionnelle)</Label>
                  <Textarea
                    id="status-note"
                    placeholder="Ajoute une note visible dans l'historique..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
                <Button onClick={handleStatusUpdate} disabled={mutation.isPending} className="w-full">
                  {mutation.isPending ? 'Mise a jour...' : nextAction.cta}
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Statut final atteint. Aucune transition supplementaire autorisee.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
