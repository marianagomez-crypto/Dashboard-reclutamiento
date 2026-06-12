'use client';

import * as React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
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
import { Boxes, CalendarRange, Layers, Sparkles } from 'lucide-react';
import { MERCH_OCCASION_COLORS, PRODUCT_TYPE_COLORS } from '@/lib/types';

// ============================================================================
// Helpers compartidos
// ============================================================================
const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--popover))',
  fontSize: 12,
} as const;

const FALLBACK = [
  '#6873D7',
  '#36B7B3',
  '#D14646',
  '#987933',
  '#4453A0',
  '#D17AA6',
  '#0E7A6B',
  '#CA8A04',
];

function formatPEN(n: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    maximumFractionDigits: 0,
  }).format(n);
}

function formatPEN2(n: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

function EmptyState({ text, hint }: { text: string; hint?: string }) {
  return (
    <div className="flex h-40 flex-col items-center justify-center rounded-xl bg-muted/40 p-6 text-center">
      <p className="text-sm font-medium text-muted-foreground">{text}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground/70">{hint}</p>}
    </div>
  );
}

// Donut reutilizable con total al centro + leyenda detallada.
function Donut({
  data,
  colorOf,
  centerValue,
  centerLabel,
  valueFmt,
}: {
  data: { name: string; value: number }[];
  colorOf: (name: string, i: number) => string;
  centerValue: string;
  centerLabel: string;
  valueFmt: (n: number) => string;
}) {
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <div>
      <div className="relative mx-auto h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="58%"
              outerRadius="90%"
              paddingAngle={2}
              strokeWidth={0}
              startAngle={90}
              endAngle={-270}
            >
              {data.map((d, i) => (
                <Cell key={d.name} fill={colorOf(d.name, i)} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(v: any, name: any) => [
                `${valueFmt(Number(v))} (${
                  total > 0 ? Math.round((Number(v) / total) * 100) : 0
                }%)`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-xl font-bold leading-none tabular-nums text-foreground">
            {centerValue}
          </span>
          <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
            {centerLabel}
          </span>
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        {data.map((d, i) => {
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
          return (
            <div key={d.name} className="flex items-center gap-2 text-xs">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: colorOf(d.name, i) }}
              />
              <span className="min-w-0 flex-1 truncate text-foreground" title={d.name}>
                {d.name}
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-foreground">
                {valueFmt(d.value)}
              </span>
              <span className="w-9 shrink-0 text-right tabular-nums text-muted-foreground">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Barras horizontales simples (label → valor) con color por celda.
function HBars({
  data,
  colorOf,
  valueFmt,
  unit = 'units',
  height,
}: {
  data: { name: string; value: number }[];
  colorOf: (name: string, i: number) => string;
  valueFmt: (n: number) => string;
  unit?: 'units' | 'money';
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const h = height ?? Math.max(data.length * 42 + 30, 160);
  return (
    <div className="w-full rounded-xl bg-muted/40 p-3">
      <div style={{ height: h }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 8, right: unit === 'money' ? 64 : 36, top: 8, bottom: 8 }}
            barCategoryGap="22%"
          >
            <CartesianGrid
              strokeDasharray="3 4"
              stroke="hsl(var(--border))"
              horizontal={false}
            />
            <XAxis
              type="number"
              stroke="hsl(var(--muted-foreground))"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              domain={[0, Math.ceil(max * 1.18) + 1]}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="hsl(var(--foreground))"
              fontSize={12}
              fontWeight={600}
              tickLine={false}
              axisLine={false}
              width={180}
              interval={0}
              tickFormatter={(v: string) => truncate(v, 24)}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
              contentStyle={TOOLTIP_STYLE}
              formatter={(v: any) => [valueFmt(Number(v)), '']}
            />
            <Bar dataKey="value" radius={[0, 10, 10, 0]} minPointSize={3}>
              {data.map((d, i) => (
                <Cell key={d.name} fill={colorOf(d.name, i)} />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                fontSize={12}
                fontWeight={800}
                fill="hsl(var(--foreground))"
                offset={8}
                formatter={(v: any) => valueFmt(Number(v))}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function typeColor(name: string, i: number): string {
  return PRODUCT_TYPE_COLORS[name] || FALLBACK[i % FALLBACK.length];
}
function occasionColor(name: string, i: number): string {
  return MERCH_OCCASION_COLORS[name] || FALLBACK[i % FALLBACK.length];
}
function eventColor(_name: string, i: number): string {
  return FALLBACK[i % FALLBACK.length];
}

// ============================================================================
// STOCK — Disponible por artículo + distribución por tipo
// ============================================================================
export interface StockChartRow {
  article: string;
  productType: string;
  disponible: number;
}

export function StockCharts({ rows }: { rows: StockChartRow[] }) {
  const byArticle = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) {
      if (r.disponible <= 0) continue;
      m.set(r.article, (m.get(r.article) || 0) + r.disponible);
    }
    return Array.from(m, ([name, value]) => ({ name, value })).sort(
      (a, b) => b.value - a.value,
    );
  }, [rows]);

  const byType = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const r of rows) {
      if (r.disponible <= 0) continue;
      m.set(r.productType, (m.get(r.productType) || 0) + r.disponible);
    }
    return Array.from(m, ([name, value]) => ({ name, value })).sort(
      (a, b) => b.value - a.value,
    );
  }, [rows]);

  const totalDisp = byType.reduce((a, t) => a + t.value, 0);
  const top = byType[0];

  return (
    <Card>
      <CardHeader>
        <div className="flex min-w-0 items-start gap-3">
          <div className="shrink-0 rounded-xl bg-brand-aqua-100 p-2 text-brand-aqua-700 dark:bg-brand-aqua-600/20 dark:text-brand-aqua-100">
            <Boxes className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <CardTitle>Disponibilidad de inventario</CardTitle>
            <CardDescription>
              Unidades disponibles por artículo y qué tipo de producto predomina
              {top ? ` · ${top.name} lidera el stock` : ''}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {totalDisp === 0 ? (
          <EmptyState
            text="No hay stock disponible"
            hint="Cuando haya unidades sin consumir aparecerán acá por artículo."
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <p className="mb-2 text-sm font-semibold text-foreground">
                Unidades disponibles por artículo
              </p>
              <HBars data={byArticle} colorOf={() => '#00A29B'} valueFmt={(n) => String(n)} />
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">
                Disponible por tipo
              </p>
              <Donut
                data={byType}
                colorOf={typeColor}
                centerValue={String(totalDisp)}
                centerLabel="unidades"
                valueFmt={(n) => String(n)}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// USOS — Monto por ocasión + monto por evento específico
// ============================================================================
export interface UsageChartRow {
  occasion?: string;
  comments?: string;
  totalAmount?: number;
}

// Gasto extra (no consume stock) — se suma a los totales por ocasión/evento.
export interface ExpenseChartRow {
  occasion?: string;
  event?: string;
  amount?: number;
}

export function UsageByOccasionChart({
  usages,
  expenses = [],
}: {
  usages: UsageChartRow[];
  expenses?: ExpenseChartRow[];
}) {
  const data = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const u of usages) {
      const key = u.occasion || 'Sin ocasión';
      m.set(key, (m.get(key) || 0) + (u.totalAmount || 0));
    }
    for (const e of expenses) {
      const key = e.occasion || 'Sin ocasión';
      m.set(key, (m.get(key) || 0) + (e.amount || 0));
    }
    return Array.from(m, ([name, value]) => ({ name, value }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [usages, expenses]);

  const total = data.reduce((a, d) => a + d.value, 0);
  const top = data[0];

  return (
    <Card>
      <CardHeader>
        <div className="flex min-w-0 items-start gap-3">
          <div className="shrink-0 rounded-xl bg-brand-gold-100 p-2 text-brand-gold-700 dark:bg-brand-gold-600/20 dark:text-brand-gold-100">
            <Layers className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <CardTitle>Gasto por ocasión</CardTitle>
            <CardDescription>
              Monto total (usos + gastos extra) por tipo de ocasión
              {top ? ` · ${top.name} es la que más gasta` : ''}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <EmptyState text="Aún no hay consumos registrados" />
        ) : (
          <Donut
            data={data}
            colorOf={occasionColor}
            centerValue={formatPEN(total)}
            centerLabel="total"
            valueFmt={formatPEN2}
          />
        )}
      </CardContent>
    </Card>
  );
}

export function UsageByEventChart({
  usages,
  expenses = [],
}: {
  usages: UsageChartRow[];
  expenses?: ExpenseChartRow[];
}) {
  const data = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const u of usages) {
      const evt = (u.comments || '').trim();
      if (!evt) continue;
      m.set(evt, (m.get(evt) || 0) + (u.totalAmount || 0));
    }
    // Los gastos extra (transporte, etc.) suman al mismo evento.
    for (const e of expenses) {
      const evt = (e.event || '').trim();
      if (!evt) continue;
      m.set(evt, (m.get(evt) || 0) + (e.amount || 0));
    }
    return Array.from(m, ([name, value]) => ({ name, value }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [usages, expenses]);

  const total = data.reduce((a, d) => a + d.value, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex min-w-0 items-start gap-3">
          <div className="shrink-0 rounded-xl bg-brand-blue-100 p-2 text-brand-blue-700 dark:bg-brand-blue-600/20 dark:text-brand-blue-100">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <CardTitle>Gasto por evento específico</CardTitle>
            <CardDescription>
              Monto por evento (usos + gastos extra) registrado en "Evento específico"
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <EmptyState
            text="Aún no hay eventos específicos"
            hint='Completá el campo "Evento específico" en los usos para verlos acá.'
          />
        ) : (
          <HBars data={data} colorOf={eventColor} valueFmt={formatPEN} unit="money" />
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// ÓRDENES DE COMPRA — Inversión por tipo de producto
// ============================================================================
export interface OrderChartRow {
  productType: string;
  totalPrice?: number;
}

export function OrdersByTypeChart({ orders }: { orders: OrderChartRow[] }) {
  const { data, counts } = React.useMemo(() => {
    const money = new Map<string, number>();
    const count = new Map<string, number>();
    for (const o of orders) {
      const key = o.productType || 'Sin tipo';
      money.set(key, (money.get(key) || 0) + (o.totalPrice || 0));
      count.set(key, (count.get(key) || 0) + 1);
    }
    const data = Array.from(money, ([name, value]) => ({ name, value }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);
    return { data, counts: count };
  }, [orders]);

  const total = data.reduce((a, d) => a + d.value, 0);
  const top = data[0];

  return (
    <Card>
      <CardHeader>
        <div className="flex min-w-0 items-start gap-3">
          <div className="shrink-0 rounded-xl bg-brand-blue-100 p-2 text-brand-blue-700 dark:bg-brand-blue-600/20 dark:text-brand-blue-100">
            <CalendarRange className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <CardTitle>Inversión por tipo de producto</CardTitle>
            <CardDescription>
              Cuánto se ha invertido por tipo y cuál predomina
              {top ? ` · ${top.name} concentra el gasto` : ''}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <EmptyState text="Aún no hay órdenes con monto" />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            <Donut
              data={data}
              colorOf={typeColor}
              centerValue={formatPEN(total)}
              centerLabel="invertido"
              valueFmt={formatPEN2}
            />
            <div className="flex flex-col justify-center gap-2">
              {data.map((d, i) => (
                <div
                  key={d.name}
                  className="rounded-xl border border-border bg-muted/30 p-3"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: typeColor(d.name, i) }}
                    />
                    <span className="text-sm font-semibold text-foreground">
                      {d.name}
                    </span>
                  </div>
                  <p className="mt-1 font-display text-lg font-bold tabular-nums text-foreground">
                    {formatPEN2(d.value)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {counts.get(d.name) || 0} órden
                    {(counts.get(d.name) || 0) === 1 ? '' : 'es'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
