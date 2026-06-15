export function formatFcfa(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace(/\u00a0/g, ' ')
    .replace('XOF', 'FCFA');
}

export function formatOrderNumber(orderId: string): string {
  return `CMD-${orderId.replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}
