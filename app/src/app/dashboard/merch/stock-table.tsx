'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Layers, Search } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PRODUCT_TYPE_COLORS } from '@/lib/types';
import { StockCharts } from '@/components/dashboard/merch-charts';

export interface StockRow {
  orderId: string;
  article: string;
  productType: string;
  comprado: number;
  usado: number;
  disponible: number;
}

function colorForType(t: string): string {
  return PRODUCT_TYPE_COLORS[t] || '#6873D7';
}

export function StockTable({
  rows,
  productTypeOptions,
}: {
  rows: StockRow[];
  productTypeOptions: string[];
}) {
  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [tab, setTab] = React.useState<'disponibles' | 'terminados'>('disponibles');

  const base = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    return rows.filter((r) => {
      if (typeFilter !== 'all' && r.productType !== typeFilter) return false;
      if (!q) return true;
      return `${r.orderId} ${r.article} ${r.productType}`.toLowerCase().includes(q);
    });
  }, [rows, search, typeFilter]);

  const tabCounts = React.useMemo(() => {
    let disponibles = 0;
    let terminados = 0;
    for (const r of base) {
      if (r.disponible > 0) disponibles += 1;
      else terminados += 1;
    }
    return { disponibles, terminados };
  }, [base]);

  const filtered = React.useMemo(
    () => base.filter((r) => (tab === 'disponibles' ? r.disponible > 0 : r.disponible <= 0)),
    [base, tab],
  );

  const totalComprado = rows.reduce((a, r) => a + r.comprado, 0);
  const totalUsado = rows.reduce((a, r) => a + r.usado, 0);
  const totalDisponible = rows.reduce((a, r) => a + r.disponible, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Stock</h1>
        <p className="text-sm text-muted-foreground">
          Unidades disponibles por orden · comprado − usado
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:max-w-lg">
        <StatCard label="Comprado" value={String(totalComprado)} />
        <StatCard label="Usado" value={String(totalUsado)} color="#CA8A04" />
        <StatCard label="Disponible" value={String(totalDisponible)} color="#00A29B" />
      </div>

      {/* Gráficos: disponible por artículo + distribución por tipo */}
      <StockCharts rows={rows} />

      {/* Tabs: Disponibles / Terminados */}
      <div className="inline-flex rounded-xl border border-border bg-muted/40 p-1">
        <button
          type="button"
          onClick={() => setTab('disponibles')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
            tab === 'disponibles'
              ? 'bg-card text-foreground shadow-soft'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Disponibles
          <span
            className={`rounded-full px-1.5 text-xs tabular-nums ${
              tab === 'disponibles'
                ? 'bg-brand-aqua-100 text-brand-aqua-700 dark:bg-brand-aqua-600/30 dark:text-brand-aqua-100'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {tabCounts.disponibles}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setTab('terminados')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
            tab === 'terminados'
              ? 'bg-card text-foreground shadow-soft'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Terminados
          <span
            className={`rounded-full px-1.5 text-xs tabular-nums ${
              tab === 'terminados'
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-600/30 dark:text-rose-100'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {tabCounts.terminados}
          </span>
        </button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="shrink-0 rounded-xl bg-brand-blue-100 p-2 text-brand-blue-700 dark:bg-brand-blue-600/20 dark:text-brand-blue-100">
                <Layers className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <CardTitle>Disponibilidad</CardTitle>
                <CardDescription>
                  Disponible = unidades compradas − unidades usadas (por orden)
                </CardDescription>
              </div>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
              <div className="relative min-w-0 flex-1 lg:w-56 lg:flex-none">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="pl-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[130px] shrink-0">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {productTypeOptions.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center rounded-xl bg-muted/40 p-6 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                No hay stock para mostrar
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[760px] border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/40 text-left">
                    <Th>ID Compra</Th>
                    <Th>Artículo</Th>
                    <Th>Tipo</Th>
                    <Th className="text-right">Comprado</Th>
                    <Th className="text-right">Usado</Th>
                    <Th className="text-right">Disponible</Th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => {
                    const color = colorForType(r.productType);
                    const low = r.disponible <= 0;
                    return (
                      <motion.tr
                        key={r.orderId + i}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.015, 0.2) }}
                        className="border-t border-border transition-colors hover:bg-muted/30"
                      >
                        <Td className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                          {r.orderId}
                        </Td>
                        <Td className="min-w-[220px] font-medium text-foreground">{r.article}</Td>
                        <Td>
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                            style={{ background: `${color}1A`, color }}
                          >
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                            {r.productType}
                          </span>
                        </Td>
                        <Td className="text-right tabular-nums">{r.comprado}</Td>
                        <Td className="text-right tabular-nums text-muted-foreground">{r.usado}</Td>
                        <Td className="text-right">
                          <span
                            className="rounded-md px-2 py-0.5 text-sm font-bold tabular-nums"
                            style={{
                              background: low ? '#D146461A' : '#00A29B1A',
                              color: low ? '#D14646' : '#00A29B',
                            }}
                          >
                            {r.disponible}
                          </span>
                        </Td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground ${className}`}>
      {children}
    </th>
  );
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 align-middle ${className}`}>{children}</td>;
}
function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-display text-2xl font-bold tabular-nums" style={color ? { color } : undefined}>
        {value}
      </p>
    </div>
  );
}
