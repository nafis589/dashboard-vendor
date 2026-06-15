'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Link from 'next/link';
import {
  AlertTriangle,
  CreditCard,
  Eye,
  Package,
  ShoppingBag,
} from 'lucide-react';

import RevenueChart from '@/components/charts/RevenueChart';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/context/AuthContext';
import { useLowStockProducts } from '@/hooks/useProducts';
import { useRecentOrders } from '@/hooks/useRecentOrders';
import { useVendorStats } from '@/hooks/useVendorStats';
import { formatFcfa, formatOrderNumber } from '@/lib/format';
import { getOrderStatusVariant, ORDER_STATUS_LABELS } from '@/lib/order-utils';

export default function Dashboard() {
  const { vendor } = useAuth();
  const [chartPeriod, setChartPeriod] = useState<'week' | 'month' | 'year'>('month');
  const { data: stats, isLoading: statsLoading } = useVendorStats();
  const { data: recentOrders = [], isLoading: ordersLoading } = useRecentOrders(5);
  const { data: lowStockProducts = [] } = useLowStockProducts();

  const currentDate = new Date();

  return (
    <div className="@container/main flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-serif text-2xl font-semibold tracking-tight">Tableau de bord</h1>
        <p className="text-muted-foreground text-sm">
          Bonjour{vendor?.first_name ? ` ${vendor.first_name}` : ''}, voici le résumé de votre
          activité du {format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })}.
        </p>
      </div>

      {lowStockProducts.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50 text-orange-950">
          <AlertTriangle className="text-orange-600" />
          <AlertTitle>Stock faible</AlertTitle>
          <AlertDescription>
            {lowStockProducts.length} produit{lowStockProducts.length > 1 ? 's' : ''} avec un stock
            ≤ 2 :{' '}
            {lowStockProducts
              .slice(0, 3)
              .map((p) => p.title)
              .join(', ')}
            {lowStockProducts.length > 3 ? '…' : ''}.{' '}
            <Link href="/products" className="font-medium underline underline-offset-2">
              Gérer mes produits
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs sm:grid-cols-2 xl:grid-cols-4">
        <TooltipProvider>
          <KpiCard
            icon={CreditCard}
            label="Revenus du mois"
            value={statsLoading ? null : formatFcfa(stats?.monthly_revenue ?? 0)}
            hint="Chiffre d'affaires ce mois-ci"
          />
          <KpiCard
            icon={ShoppingBag}
            label="Commandes en attente"
            value={statsLoading ? null : String(stats?.pending_orders ?? 0)}
            hint="À traiter"
            badge={
              (stats?.pending_orders ?? 0) > 0 ? (
                <Badge className="bg-orange-500 text-white hover:bg-orange-500">
                  {stats?.pending_orders}
                </Badge>
              ) : undefined
            }
          />
          <KpiCard
            icon={Package}
            label="Produits actifs"
            value={statsLoading ? null : String(stats?.active_products ?? 0)}
            hint="En ligne sur la marketplace"
          />
          <KpiCard
            icon={Eye}
            label="Vues ce mois"
            value={statsLoading ? null : String(stats?.monthly_views ?? 0)}
            hint="Vues sur vos nouveaux produits"
          />
        </TooltipProvider>
      </div>

      <RevenueChart period={chartPeriod} onPeriodChange={setChartPeriod} />

      <Card className="min-w-0 overflow-hidden shadow-none">
        <CardHeader>
          <CardTitle>Dernières commandes</CardTitle>
          <CardDescription>Les commandes les plus récentes de votre boutique.</CardDescription>
          <CardAction>
            <Badge variant="outline" className="font-medium tabular-nums">
              {recentOrders.length} commande{recentOrders.length !== 1 ? 's' : ''}
            </Badge>
          </CardAction>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="min-w-0 overflow-hidden rounded-lg border">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="text-sm">Commande</TableHead>
                  <TableHead className="text-sm">Acheteur</TableHead>
                  <TableHead className="text-sm">Articles</TableHead>
                  <TableHead className="text-sm">Statut</TableHead>
                  <TableHead className="text-right text-sm">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ordersLoading ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-14 w-full" />
                    </TableCell>
                  </TableRow>
                ) : recentOrders.length > 0 ? (
                  recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Link
                            href={`/orders/${order.id}`}
                            className="font-medium text-base hover:underline"
                          >
                            {formatOrderNumber(order.id)}
                          </Link>
                          <p className="text-muted-foreground text-sm">
                            {format(new Date(order.created_at), 'dd/MM/yyyy · HH:mm', {
                              locale: fr,
                            })}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{order.buyer_name}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm tabular-nums">
                          {order.items_count} article{order.items_count !== 1 ? 's' : ''}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getOrderStatusVariant(order.status)}>
                          {ORDER_STATUS_LABELS[order.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <Badge
                            variant="outline"
                            className="min-w-20 justify-center border-primary/35 bg-primary/10 py-1 text-sm font-medium tabular-nums text-primary"
                          >
                            {formatFcfa(order.total_amount)}
                          </Badge>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Aucune commande récente
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null;
  hint: string;
  badge?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
            <Icon className="size-4" />
          </div>
          {badge}
        </div>
        <CardDescription>{label}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {value === null ? (
          <Skeleton className="h-9 w-32" />
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="font-medium text-3xl tabular-nums leading-none tracking-tight truncate max-w-full">
                {value}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>{value}</p>
            </TooltipContent>
          </Tooltip>
        )}
        <p className="text-muted-foreground text-sm truncate">{hint}</p>
      </CardContent>
    </Card>
  );
}
