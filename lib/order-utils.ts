import type { OrderStatus } from '@/lib/types';
import { formatFcfa } from '@/lib/format';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  PREPARING: 'En préparation',
  SHIPPED: 'Expédiée',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
  RETURNED: 'Retournée',
};

export function getOrderItemsTotal(totalAmount: number, shippingFee: number): number {
  return totalAmount - shippingFee;
}

export function formatOrderAmountTooltip(itemsTotal: number, shippingFee: number): string {
  return `Articles : ${formatFcfa(itemsTotal)} · Livraison : ${formatFcfa(shippingFee)}`;
}

export function formatShippingMethodLabel(method: 'PER_KM' | 'FIXED'): string {
  return method === 'PER_KM' ? 'Par kilomètre' : 'Prix fixe inter-région';
}

export function getOrderStatusVariant(
  status: OrderStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'PENDING':
      return 'outline';
    case 'CONFIRMED':
    case 'PREPARING':
      return 'secondary';
    case 'DELIVERED':
      return 'default';
    case 'CANCELLED':
    case 'RETURNED':
      return 'destructive';
    default:
      return 'outline';
  }
}
