'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useRevenueChart } from '@/hooks/useVendorStats';
import { formatFcfa } from '@/lib/format';

type ChartPeriod = 'week' | 'month' | 'year';

interface RevenueChartProps {
  period: ChartPeriod;
  onPeriodChange: (period: ChartPeriod) => void;
}

const chartConfig = {
  revenue: {
    label: 'Revenus',
    color: '#1a1a1a',
  },
};

const axisDayFormatter = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
});

const axisMonthFormatter = new Intl.DateTimeFormat('fr-FR', { month: 'short' });

function buildFallbackDate(period: ChartPeriod, index: number, total: number): string {
  const now = new Date();
  if (period === 'week') {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(now.getDate() - (total - 1 - index));
    return d.toISOString();
  }
  if (period === 'year') {
    return new Date(now.getFullYear(), index, 1).toISOString();
  }
  return new Date(now.getFullYear(), now.getMonth(), index + 1).toISOString();
}

export default function RevenueChart({ period, onPeriodChange }: RevenueChartProps) {
  const { data = [], isLoading, isError } = useRevenueChart(period);

  const chartData = useMemo(() => {
    if (!data.length) return [];

    return data.map((point, index) => {
      const date = point.date ?? buildFallbackDate(period, index, data.length);
      return {
        date,
        label: point.label,
        revenue: Number(point.revenue) || 0,
      };
    });
  }, [data, period]);

  const formatXTick = (value: string) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    if (period === 'year') return axisMonthFormatter.format(d);
    return axisDayFormatter.format(d);
  };

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle>Flux de revenus</CardTitle>
        <CardAction>
          <Select
            value={period}
            onValueChange={(value) => onPeriodChange(value as ChartPeriod)}
          >
            <SelectTrigger size="sm" className="min-w-40">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois-ci</SelectItem>
                <SelectItem value="year">Cette année</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-72 w-full" />
        ) : isError ? (
          <div className="flex h-72 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            Impossible de charger le graphique. Vérifiez la connexion au backend.
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-72 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            Aucune donnée de revenu pour cette période.
          </div>
        ) : (
          <div className="h-72 w-full">
            <ChartContainer
              config={chartConfig}
              className="aspect-auto h-full w-full min-h-[288px]"
            >
              <BarChart
                data={chartData}
                margin={{ left: 8, right: 8, top: 8, bottom: 0 }}
                barSize={period === 'year' ? 28 : 38}
              >
                <CartesianGrid vertical={false} strokeDasharray="0" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  minTickGap={28}
                  interval="preserveStartEnd"
                  tickFormatter={formatXTick}
                />
                <YAxis hide domain={[0, 'auto']} />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideIndicator
                      labelFormatter={(_label, payload) => {
                        const item = payload?.[0]?.payload as {
                          label?: string;
                          date?: string;
                        };
                        if (item?.label) return item.label;
                        if (item?.date) return formatXTick(item.date);
                        return '';
                      }}
                      formatter={(value) => formatFcfa(Number(value))}
                    />
                  }
                />
                <Bar dataKey="revenue" fill="#1a1a1a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
