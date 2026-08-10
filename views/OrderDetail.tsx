'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import RefuseOrderModal from '@/components/orders/RefuseOrderModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useOrderDetail, useUpdateOrderStatus } from '@/hooks/useOrders';
import { ORDER_STATUS_LABELS, formatShippingMethodLabel } from '@/lib/order-utils';
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
  REFUSED: null,
};

function timelineDotClass(status: OrderStatus): string {
  if (status === 'REFUSED') return 'bg-[#7F1D1D] ring-[#7F1D1D]/20';
  switch (status) {
    case 'PENDING':
      return 'bg-orange-500 ring-orange-500/20';
    case 'CONFIRMED':
    case 'PREPARING':
      return 'bg-blue-500 ring-blue-500/20';
    case 'SHIPPED':
      return 'bg-violet-500 ring-violet-500/20';
    case 'DELIVERED':
      return 'bg-emerald-500 ring-emerald-500/20';
    case 'CANCELLED':
    case 'RETURNED':
      return 'bg-red-500 ring-red-500/20';
    default:
      return 'bg-muted ring-muted/20';
  }
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
    case 'REFUSED':
      return 'border-transparent bg-[#7F1D1D] text-white';
    default:
      return 'border-transparent';
  }
}

export default function OrderDetail({ orderId }: OrderDetailProps) {
  const [note, setNote] = useState('');
  const [refuseOpen, setRefuseOpen] = useState(false);
  const { data, isLoading, isError, refetch } = useOrderDetail(orderId);
  const mutation = useUpdateOrderStatus(orderId);

  const order = data?.data;
  const nextAction = order ? NEXT_TRANSITION[order.status] : null;

  const latitude = order?.shipping_address.latitude;
  const longitude = order?.shipping_address.longitude;
  const [addressLabel, setAddressLabel] = useState('');

  useEffect(() => {
    if (!order) return;
    const stored = order.shipping_address.address_label;
    if (stored) {
      setAddressLabel(stored);
      return;
    }
    if (latitude == null || longitude == null) return;

    let cancelled = false;
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=fr`,
      { headers: { Accept: 'application/json' } },
    )
      .then((r) => r.json())
      .then((resdata: { address?: Record<string, string>; display_name?: string }) => {
        if (cancelled) return;
        const a = resdata.address ?? {};
        const label =
          a.neighbourhood ||
          a.suburb ||
          a.village ||
          a.town ||
          a.city ||
          resdata.display_name?.split(',')[0] ||
          `${latitude}, ${longitude}`;
        const city = a.city || a.town || '';
        setAddressLabel(city && label !== city ? `${label}, ${city}` : label);
      })
      .catch(() => {
        if (!cancelled) setAddressLabel(`${latitude}, ${longitude}`);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.id, latitude, longitude]);

  const googleMapsUrl =
    latitude != null && longitude != null
      ? `https://www.google.com/maps?q=${latitude},${longitude}`
      : null;

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
                  {item.offer_id && item.original_price != null && (
                    <span className="mt-1 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                      Offre acceptée
                    </span>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-medium sm:text-base">
                    {(item.unit_price * item.quantity).toLocaleString('fr-FR')} FCFA
                  </p>
                  {item.offer_id && item.original_price != null && (
                    <p className="text-xs text-muted-foreground line-through">
                      {(item.original_price * item.quantity).toLocaleString('fr-FR')} FCFA
                    </p>
                  )}
                </div>
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
                {googleMapsUrl ? (
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    {addressLabel || 'Localisation…'}
                    <ExternalLink className="size-3.5 shrink-0" />
                  </a>
                ) : (
                  addressLabel || 'Non precisee'
                )}
              </span>
            </div>
            {order.shipping_address.notes && (
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Note</span>
                <span className="max-w-[220px] text-right font-medium">
                  {order.shipping_address.notes}
                </span>
              </div>
            )}
            <div className="flex justify-between gap-3 pt-2">
              <span className="text-muted-foreground">Frais de livraison</span>
              <span className="font-medium text-right">
                {order.shipping_fee.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
            {order.shipping_detail && (
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Détail</span>
                <span className="max-w-[220px] text-right font-medium">{order.shipping_detail}</span>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Méthode</span>
              <span className="font-medium text-right">
                {formatShippingMethodLabel(order.shipping_method)}
              </span>
            </div>
            {order.shipping_method === 'PER_KM' && order.shipping_distance_km != null && (
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Distance</span>
                <span className="font-medium text-right">
                  {order.shipping_distance_km.toLocaleString('fr-FR')} km
                </span>
              </div>
            )}
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Région</span>
              <span className="font-medium text-right">{order.shipping_region_id}</span>
            </div>
            <div className="flex justify-between gap-3 pt-2">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold text-right">
                {(itemsTotal + order.shipping_fee).toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>

          {/* Payment section */}
          <div className="space-y-2 text-sm pt-4">
            <h2 className="pb-1 text-base font-semibold text-foreground">Paiement</h2>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Mode</span>
              <span>
                {order.payment_method === 'CARD' ? (
                  <span className="inline-flex items-center rounded-full border border-transparent bg-violet-100 px-2.5 py-0.5 text-xs font-semibold text-violet-700">
                    Carte bancaire (Stripe)
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full border border-transparent bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                    À la livraison
                  </span>
                )}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Statut</span>
              <span>
                {order.payment_status === 'PAID' && (
                  <span className="inline-flex items-center rounded-full border border-transparent bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    Payé ✓
                  </span>
                )}
                {order.payment_status === 'UNPAID' && (
                  <span className="inline-flex items-center rounded-full border border-transparent bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                    Non payé
                  </span>
                )}
                {order.payment_status === 'FAILED' && (
                  <span className="inline-flex items-center rounded-full border border-transparent bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                    Échec paiement
                  </span>
                )}
                {order.payment_status === 'REFUNDED' && (
                  <span className="inline-flex items-center rounded-full border border-transparent bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                    Remboursé
                  </span>
                )}
              </span>
            </div>
            {order.payment_status === 'PAID' && order.payment_intent_id && (
              <p className="text-xs text-muted-foreground break-all">
                ID Stripe : {order.payment_intent_id}
              </p>
            )}
          </div>

          <div className="space-y-3 pt-4">
            <h2 className="text-base font-semibold text-foreground">Changement de statut</h2>
            {order.status_history.length > 0 && (
              <div className="space-y-0 rounded-lg border p-4">
                <h3 className="mb-3 text-sm font-medium text-muted-foreground">Historique</h3>
                {order.status_history.map((entry, index) => (
                  <div key={entry.id} className="relative flex gap-3 pb-5 last:pb-0">
                    {index < order.status_history.length - 1 && (
                      <div className="absolute left-[9px] top-5 h-[calc(100%-12px)] w-0.5 bg-border" />
                    )}
                    <div
                      className={`relative z-10 mt-0.5 size-[18px] shrink-0 rounded-full ring-4 ${timelineDotClass(entry.status)}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{ORDER_STATUS_LABELS[entry.status]}</p>
                      {entry.note && (
                        <p className="mt-0.5 text-sm text-muted-foreground">{entry.note}</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                <div className="flex flex-col gap-2">
                  <Button onClick={handleStatusUpdate} disabled={mutation.isPending} className="w-full">
                    {mutation.isPending ? 'Mise a jour...' : nextAction.cta}
                  </Button>
                  {order.status === 'PENDING' && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => setRefuseOpen(true)}
                    >
                      <XCircle className="mr-2 size-4" />
                      Refuser la commande
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Statut final atteint. Aucune transition supplementaire autorisee.
              </p>
            )}
          </div>
        </div>
      </div>

      <RefuseOrderModal
        open={refuseOpen}
        onOpenChange={setRefuseOpen}
        orderId={order.id}
        orderNumber={`#${order.id.slice(0, 8).toUpperCase()}`}
        onSuccess={() => {
          toast.success('Commande refusée — le stock a été restauré');
          void refetch();
        }}
      />
    </div>
  );
}
