'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowUpDown, Boxes, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MERCH_OCCASIONS,
  MERCH_OCCASION_COLORS,
  type MerchExtraExpense,
  type MerchUsage,
  type PurchaseOrder,
} from '@/lib/types';
import { useCanMutate } from '@/components/auth/role-context';
import {
  UsageByEventChart,
  UsageByOccasionChart,
} from '@/components/dashboard/merch-charts';

interface Props {
  initialUsages: MerchUsage[];
  orders: PurchaseOrder[];
  availableByOrder: Record<string, number>;
  // Gastos extra del mismo módulo: se suman en los gráficos por ocasión/evento.
  initialExpenses?: MerchExtraExpense[];
}

// Corte: "dos últimos meses" = fecha de uso >= hoy − 2 meses (ISO YYYY-MM-DD).
function twoMonthsAgoISO(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 2);
  return d.toISOString().slice(0, 10);
}

function colorForOccasion(o?: string): string {
  return (o && MERCH_OCCASION_COLORS[o]) || '#6873D7';
}

function formatMoney(n?: number | null): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatDate(iso?: string): string {
  if (!iso) return '—';
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function numOrDash(n?: number | null): string {
  return n === null || n === undefined || !Number.isFinite(n) ? '—' : String(n);
}

export function UsosTable({
  initialUsages,
  orders,
  availableByOrder,
  initialExpenses = [],
}: Props) {
  const router = useRouter();
  const canMutate = useCanMutate();

  const [usages, setUsages] = React.useState(initialUsages);
  React.useEffect(() => setUsages(initialUsages), [initialUsages]);
  // Solo lectura para los gráficos; se re-sincroniza tras cada router.refresh().
  const [expenses, setExpenses] = React.useState(initialExpenses);
  React.useEffect(() => setExpenses(initialExpenses), [initialExpenses]);

  const [search, setSearch] = React.useState('');
  const [occasionFilter, setOccasionFilter] = React.useState<string>('all');
  const [sortBy, setSortBy] = React.useState<'fecha' | 'ocasion' | 'evento'>('fecha');
  const [tab, setTab] = React.useState<'recientes' | 'anteriores'>('recientes');
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<MerchUsage | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<MerchUsage | null>(null);

  const cutoff = React.useMemo(() => twoMonthsAgoISO(), []);
  // Reciente = sin fecha o fecha >= corte; anterior = fecha < corte.
  const isRecent = React.useCallback(
    (u: MerchUsage) => !u.usageDate || u.usageDate >= cutoff,
    [cutoff],
  );

  // Conexión con Compras: artículo según la orden referenciada (orderId).
  const articleByOrderId = React.useMemo(() => {
    const m = new Map<string, string>();
    orders.forEach((o) => m.set(o.orderId, o.article));
    return m;
  }, [orders]);

  // Base: búsqueda + filtro de ocasión (sin el tab).
  const base = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    return usages.filter((u) => {
      if (occasionFilter !== 'all' && u.occasion !== occasionFilter) return false;
      if (!q) return true;
      const article = articleByOrderId.get(u.orderId) || '';
      const hay = `${u.orderId} ${article} ${u.occasion || ''} ${u.comments || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [usages, search, occasionFilter, articleByOrderId]);

  const tabCounts = React.useMemo(() => {
    let recientes = 0;
    let anteriores = 0;
    for (const u of base) {
      if (isRecent(u)) recientes += 1;
      else anteriores += 1;
    }
    return { recientes, anteriores };
  }, [base, isRecent]);

  // Compara por fecha de uso, más reciente primero (sin fecha al tope).
  const byDateDesc = (a: MerchUsage, b: MerchUsage) =>
    (b.usageDate || '9999-12-31').localeCompare(a.usageDate || '9999-12-31');
  // Texto vacío va al final; como desempate, fecha más reciente primero.
  const byTextThenDate = (
    a: MerchUsage,
    b: MerchUsage,
    pick: (u: MerchUsage) => string,
  ) => {
    const ta = pick(a).trim();
    const tb = pick(b).trim();
    if (!ta && !tb) return byDateDesc(a, b);
    if (!ta) return 1;
    if (!tb) return -1;
    return ta.localeCompare(tb, 'es', { sensitivity: 'base' }) || byDateDesc(a, b);
  };

  const filtered = React.useMemo(() => {
    const rows = base.filter((u) => (tab === 'recientes' ? isRecent(u) : !isRecent(u)));
    if (sortBy === 'ocasion') {
      return rows.sort((a, b) => byTextThenDate(a, b, (u) => u.occasion || ''));
    }
    if (sortBy === 'evento') {
      return rows.sort((a, b) => byTextThenDate(a, b, (u) => u.comments || ''));
    }
    return rows.sort(byDateDesc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, tab, isRecent, sortBy]);

  const totalConsumido = usages.reduce((acc, u) => acc + (u.totalAmount || 0), 0);

  async function handleDelete() {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setConfirmDelete(null);
    const prev = usages;
    setUsages((arr) => arr.filter((u) => u.id !== id));
    try {
      const res = await fetch(`/api/merch/usages/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error');
      toast.success('Uso eliminado');
      router.refresh();
    } catch (err: any) {
      setUsages(prev);
      toast.error('No se pudo eliminar');
    }
  }

  return (
    <>
      {/* Gráficos: gasto por ocasión + gasto por evento específico */}
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <UsageByOccasionChart usages={usages} expenses={expenses} />
        <UsageByEventChart usages={usages} expenses={expenses} />
      </div>

      {/* Tabs: Dos últimos meses / Usos anteriores */}
      <div className="mb-6 inline-flex rounded-xl border border-border bg-muted/40 p-1">
        <button
          type="button"
          onClick={() => setTab('recientes')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
            tab === 'recientes'
              ? 'bg-card text-foreground shadow-soft'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Dos últimos meses
          <span
            className={`rounded-full px-1.5 text-xs tabular-nums ${
              tab === 'recientes'
                ? 'bg-brand-aqua-100 text-brand-aqua-700 dark:bg-brand-aqua-600/30 dark:text-brand-aqua-100'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {tabCounts.recientes}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setTab('anteriores')}
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
            tab === 'anteriores'
              ? 'bg-card text-foreground shadow-soft'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Usos anteriores
          <span
            className={`rounded-full px-1.5 text-xs tabular-nums ${
              tab === 'anteriores'
                ? 'bg-brand-blue-100 text-brand-blue-700 dark:bg-brand-blue-600/30 dark:text-brand-blue-100'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {tabCounts.anteriores}
          </span>
        </button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="shrink-0 rounded-xl bg-brand-aqua-100 p-2 text-brand-aqua-700 dark:bg-brand-aqua-600/20 dark:text-brand-aqua-100">
                <Boxes className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <CardTitle>Usos</CardTitle>
                <CardDescription>
                  Consumos por ocasión · {formatMoney(totalConsumido)} en total ·
                  conectado a Compras registradas
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
              <Select value={occasionFilter} onValueChange={setOccasionFilter}>
                <SelectTrigger className="w-[170px] shrink-0">
                  <SelectValue placeholder="Ocasión" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las ocasiones</SelectItem>
                  {MERCH_OCCASIONS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="w-[180px] shrink-0">
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fecha">Fecha (más reciente)</SelectItem>
                  <SelectItem value="ocasion">Ocasión</SelectItem>
                  <SelectItem value="evento">Evento específico</SelectItem>
                </SelectContent>
              </Select>
              {canMutate && (
                <Button
                  variant="gradient"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setCreating(true)}
                  disabled={orders.length === 0}
                >
                  <Plus className="h-4 w-4" />
                  Nuevo
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center rounded-xl bg-muted/40 p-6 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                No hay usos para mostrar
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Registrá un consumo con "Nuevo" o ajustá los filtros.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[1000px] border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/40 text-left">
                    <Th>Fecha</Th>
                    <Th>Artículo</Th>
                    <Th>ID Compra Usado</Th>
                    <Th className="text-right">Cantidad</Th>
                    <Th className="text-right">Precio Unit</Th>
                    <Th className="text-right">Monto total</Th>
                    <Th>Ocasión</Th>
                    <Th>Evento específico</Th>
                    <Th className="text-right">Acciones</Th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => {
                    const color = colorForOccasion(u.occasion);
                    const article = articleByOrderId.get(u.orderId);
                    return (
                      <motion.tr
                        key={u.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.015, 0.2) }}
                        className="border-t border-border transition-colors hover:bg-muted/30"
                      >
                        <Td className="whitespace-nowrap text-muted-foreground">
                          {formatDate(u.usageDate)}
                        </Td>
                        <Td className="min-w-[200px] font-medium text-foreground">
                          {article || (
                            <span className="text-muted-foreground">
                              (orden no encontrada)
                            </span>
                          )}
                        </Td>
                        <Td className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                          {u.orderId}
                        </Td>
                        <Td className="text-right tabular-nums">
                          {numOrDash(u.quantity)}
                        </Td>
                        <Td className="whitespace-nowrap text-right tabular-nums">
                          {formatMoney(u.unitPrice)}
                        </Td>
                        <Td className="whitespace-nowrap text-right font-semibold tabular-nums">
                          {formatMoney(u.totalAmount)}
                        </Td>
                        <Td>
                          {u.occasion ? (
                            <span
                              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                              style={{ background: `${color}1A`, color }}
                            >
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ background: color }}
                              />
                              {u.occasion}
                            </span>
                          ) : (
                            '—'
                          )}
                        </Td>
                        <Td className="min-w-[180px] max-w-[280px] text-muted-foreground">
                          {u.comments ? (
                            <span className="block truncate" title={u.comments}>
                              {u.comments}
                            </span>
                          ) : (
                            '—'
                          )}
                        </Td>
                        <Td>
                          <div className="flex items-center justify-end gap-1">
                            {canMutate && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setEditing(u)}
                                aria-label="Editar"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {canMutate && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => setConfirmDelete(u)}
                                aria-label="Eliminar"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {!canMutate && (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
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

      {/* Crear */}
      <UsageFormDialog
        open={creating}
        onOpenChange={setCreating}
        orders={orders}
        availableByOrder={availableByOrder}
        onSubmitted={(item) => {
          setUsages((arr) => [...arr, item]);
          router.refresh();
        }}
      />

      {/* Editar */}
      <UsageFormDialog
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        usage={editing || undefined}
        orders={orders}
        availableByOrder={availableByOrder}
        onSubmitted={(item) => {
          setUsages((arr) => arr.map((x) => (x.id === item.id ? item : x)));
          setEditing(null);
          router.refresh();
        }}
      />

      {/* Confirmar eliminar */}
      <Dialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar uso</DialogTitle>
            <DialogDescription>
              ¿Seguro que querés eliminar este uso de{' '}
              <span className="font-semibold text-foreground">
                {confirmDelete?.orderId}
              </span>
              ? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Th({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={`px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground ${className}`}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-3 py-2.5 align-middle ${className}`}>{children}</td>;
}

// ============================================================================
// Modal de creación / edición
// ============================================================================
function toNum(s: string): number | undefined {
  if (s.trim() === '') return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function UsageFormDialog({
  open,
  onOpenChange,
  usage,
  orders,
  availableByOrder,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  usage?: MerchUsage;
  orders: PurchaseOrder[];
  availableByOrder: Record<string, number>;
  onSubmitted: (item: MerchUsage) => void;
}) {
  const isEdit = !!usage;
  const [loading, setLoading] = React.useState(false);

  const [usageDate, setUsageDate] = React.useState('');
  const [orderId, setOrderId] = React.useState('');
  const [quantity, setQuantity] = React.useState('');
  const [occasion, setOccasion] = React.useState<string>('Focus Group');
  const [comments, setComments] = React.useState('');

  const orderByOrderId = React.useMemo(() => {
    const m = new Map<string, PurchaseOrder>();
    orders.forEach((o) => m.set(o.orderId, o));
    return m;
  }, [orders]);

  // Solo órdenes con stock disponible (>0). Al editar, incluye la orden actual.
  const selectableOrders = React.useMemo(
    () =>
      orders.filter(
        (o) => (availableByOrder[o.orderId] || 0) > 0 || o.orderId === usage?.orderId,
      ),
    [orders, availableByOrder, usage],
  );

  React.useEffect(() => {
    if (!open) return;
    setUsageDate(usage?.usageDate || '');
    setOrderId(usage?.orderId || '');
    setQuantity(usage?.quantity !== undefined ? String(usage.quantity) : '');
    setOccasion(usage?.occasion || 'Focus Group');
    setComments(usage?.comments || '');
  }, [open, usage]);

  // Precio unit y monto total se derivan de la orden + cantidad.
  const selectedOrder = orderByOrderId.get(orderId);
  const unitPrice = selectedOrder?.unitPrice;
  const qtyNum = toNum(quantity);
  const totalAmount =
    unitPrice !== undefined && qtyNum !== undefined
      ? Math.round(unitPrice * qtyNum * 100) / 100
      : undefined;
  // Máximo permitido = disponible de la orden. Al editar el mismo uso, se le
  // suma de vuelta la cantidad que ya consumía (sino bloquearía al re-guardar).
  const ownQty = isEdit && usage?.orderId === orderId ? usage?.quantity || 0 : 0;
  const maxQty =
    orderId && availableByOrder[orderId] !== undefined
      ? availableByOrder[orderId] + ownQty
      : undefined;
  const disponible = maxQty;
  const exceedsStock = maxQty !== undefined && qtyNum !== undefined && qtyNum > maxQty;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orderId) return toast.error('Seleccioná la orden de compra');
    if (exceedsStock)
      return toast.error(
        `Solo quedan ${maxQty} unidad${maxQty === 1 ? '' : 'es'} disponibles de esta orden`,
      );

    setLoading(true);
    try {
      const url = isEdit ? `/api/merch/usages/${usage!.id}` : '/api/merch/usages';
      const payload = {
        usageDate: usageDate || null,
        orderId,
        quantity: qtyNum ?? null,
        unitPrice: unitPrice ?? null,
        totalAmount: totalAmount ?? null,
        occasion: occasion || null,
        comments: comments.trim() || null,
      };
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({ error: `Error ${res.status}` }));
      if (!res.ok) throw new Error((json as any).error || 'Error');
      onSubmitted((json as any).data);
      toast.success(isEdit ? 'Uso actualizado' : 'Uso registrado');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'No se pudo guardar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar uso' : 'Nuevo uso'}</DialogTitle>
          <DialogDescription>
            Registrá el consumo. El artículo, precio y monto se toman de la orden.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>ID Compra Usado</Label>
            <Select value={orderId} onValueChange={setOrderId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar orden de compra" />
              </SelectTrigger>
              <SelectContent>
                {selectableOrders.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    No hay órdenes con stock disponible
                  </div>
                ) : (
                  selectableOrders.map((o) => (
                    <SelectItem key={o.id} value={o.orderId}>
                      {o.orderId} · {o.article} (disp. {availableByOrder[o.orderId] ?? 0})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedOrder && (
              <p className="text-[11px] text-muted-foreground">
                {selectedOrder.article} · Precio unit {formatMoney(unitPrice)}
                {disponible !== undefined ? ` · Disponible ${disponible}` : ''}
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Fecha</Label>
              <Input type="date" value={usageDate} onChange={(e) => setUsageDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Cantidad</Label>
              <Input
                type="number"
                min={0}
                max={maxQty}
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                aria-invalid={exceedsStock}
                className={exceedsStock ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
              {exceedsStock && (
                <p className="text-[11px] font-medium text-destructive">
                  Máx. {maxQty} disponible{maxQty === 1 ? '' : 's'}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Ocasión</Label>
              <Select value={occasion} onValueChange={setOccasion}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MERCH_OCCASIONS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Evento específico</Label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              placeholder="Ej: Aniversario empresa, Día del trabajador, Onboarding mayo…"
              className="flex w-full rounded-lg border border-input bg-background/60 px-3 py-2 text-sm shadow-sm transition placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Monto total calculado */}
          <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm">
            <span className="text-muted-foreground">Monto total: </span>
            <span className="font-semibold tabular-nums text-foreground">
              {formatMoney(totalAmount)}
            </span>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="gradient" disabled={loading || exceedsStock}>
              {isEdit ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {isEdit ? 'Guardar' : 'Registrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
