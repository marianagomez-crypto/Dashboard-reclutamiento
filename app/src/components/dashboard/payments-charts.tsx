'use client';

import * as React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertCircle, PieChart as PieIcon } from 'lucide-react';
import {
  DEFAULT_PAYMENT_STATUS,
  PAYMENT_MONTHS,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_COLORS,
  type PaymentStatus,
} from '@/lib/types';

// Funciona para cualquier entidad con estado de pago por mes (pagos fijos, RHE…).
type MonthlyStatusItem = { status: Record<string, PaymentStatus> };

const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--popover))',
  fontSize: 12,
} as const;

// Estados "por gestionar" (no finalizados): se apilan en el gráfico por mes.
const ATTENTION_STATUSES = ['Pendiente', 'Parcial', 'Programado'] as const;

export function PaymentsCharts({
  payments,
  selectedMonth,
  onSelectMonth,
}: {
  payments: MonthlyStatusItem[];
  selectedMonth: string;
  onSelectMonth?: (key: string) => void;
}) {
  const monthInfo =
    PAYMENT_MONTHS.find((m) => m.key === selectedMonth) || PAYMENT_MONTHS[0];

  // Donut: distribución de estados del mes seleccionado.
  const { statusData, total, pendientesMes } = React.useMemo(() => {
    const counts: Record<string, number> = {};
    PAYMENT_STATUSES.forEach((s) => (counts[s] = 0));
    for (const p of payments) {
      const s = p.status[selectedMonth] || DEFAULT_PAYMENT_STATUS;
      counts[s] = (counts[s] || 0) + 1;
    }
    return {
      statusData: PAYMENT_STATUSES.map((s) => ({ name: s, value: counts[s] })).filter(
        (d) => d.value > 0,
      ),
      total: payments.length,
      pendientesMes: counts['Pendiente'] || 0,
    };
  }, [payments, selectedMonth]);

  // Barras apiladas por mes: lo que falta cerrar (Pendiente + Parcial + Programado).
  const byMonth = React.useMemo(
    () =>
      PAYMENT_MONTHS.map((m) => {
        const row: any = {
          key: m.key,
          label: m.label,
          Pendiente: 0,
          Parcial: 0,
          Programado: 0,
          total: 0,
        };
        for (const p of payments) {
          const s = p.status[m.key] || DEFAULT_PAYMENT_STATUS;
          if (s === 'Pendiente' || s === 'Parcial' || s === 'Programado') {
            row[s] += 1;
            row.total += 1;
          }
        }
        return row;
      }),
    [payments],
  );

  if (payments.length === 0) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Donut: estado del mes */}
      <Card>
        <CardHeader>
          <div className="flex min-w-0 items-start gap-3">
            <div className="shrink-0 rounded-xl bg-brand-blue-100 p-2 text-brand-blue-700 dark:bg-brand-blue-600/20 dark:text-brand-blue-100">
              <PieIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle>Estado de pagos · {monthInfo.full}</CardTitle>
              <CardDescription>
                {pendientesMes === 0
                  ? 'Todos los pagos del mes están atendidos 🎉'
                  : `${pendientesMes} de ${total} pagos siguen pendientes este mes`}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[160px_1fr] items-center gap-4">
            <div className="relative h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="60%"
                    outerRadius="92%"
                    paddingAngle={2}
                    strokeWidth={0}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {statusData.map((d) => (
                      <Cell key={d.name} fill={PAYMENT_STATUS_COLORS[d.name]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(v: any, name: any) => [
                      `${v} (${total > 0 ? Math.round((Number(v) / total) * 100) : 0}%)`,
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-2xl font-bold leading-none tabular-nums text-foreground">
                  {total}
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                  pagos
                </span>
              </div>
            </div>
            <div className="space-y-1.5">
              {PAYMENT_STATUSES.map((s) => {
                const v = statusData.find((d) => d.name === s)?.value || 0;
                const pct = total > 0 ? Math.round((v / total) * 100) : 0;
                return (
                  <div key={s} className="flex items-center gap-2 text-xs">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: PAYMENT_STATUS_COLORS[s] }}
                    />
                    <span className="min-w-0 flex-1 truncate text-foreground">{s}</span>
                    <span className="shrink-0 font-semibold tabular-nums text-foreground">
                      {v}
                    </span>
                    <span className="w-9 shrink-0 text-right tabular-nums text-muted-foreground">
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Barras apiladas: por gestionar por mes (pendiente + parcial + programado) */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="shrink-0 rounded-xl bg-rose-100 p-2 text-rose-700 dark:bg-rose-600/20 dark:text-rose-100">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <CardTitle>Pagos por gestionar por mes</CardTitle>
                <CardDescription>
                  Pendientes, parciales y programados — lo que falta cerrar cada mes · tocá
                  una barra para ir al mes
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              {ATTENTION_STATUSES.map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-[3px]"
                    style={{ background: PAYMENT_STATUS_COLORS[s] }}
                  />
                  <span className="text-muted-foreground">{s}</span>
                </span>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-52 w-full rounded-xl bg-muted/40 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={byMonth}
                margin={{ left: 0, right: 8, top: 14, bottom: 4 }}
                barCategoryGap="20%"
                onClick={(state: any) => {
                  const k = state?.activePayload?.[0]?.payload?.key;
                  if (k && onSelectMonth) onSelectMonth(k);
                }}
              >
                <CartesianGrid strokeDasharray="3 4" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                  width={28}
                />
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                  contentStyle={TOOLTIP_STYLE}
                  labelFormatter={(l: any) => `Mes: ${l}`}
                />
                {ATTENTION_STATUSES.map((s, idx) => (
                  <Bar
                    key={s}
                    dataKey={s}
                    name={s}
                    stackId="x"
                    fill={PAYMENT_STATUS_COLORS[s]}
                    cursor="pointer"
                    radius={idx === ATTENTION_STATUSES.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                  >
                    {byMonth.map((d) => (
                      <Cell key={d.key} fillOpacity={d.key === selectedMonth ? 1 : 0.45} />
                    ))}
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
