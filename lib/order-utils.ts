import type { OrderStatus } from '@/lib/types';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  PREPARING: 'En préparation',
  SHIPPED: 'Expédiée',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
  RETURNED: 'Retournée',
};

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
