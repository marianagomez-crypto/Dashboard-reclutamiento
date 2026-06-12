'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Package, Pencil, Plus, Search, Trash2 } from 'lucide-react';
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
  PRODUCT_TYPE_COLORS,
  type PurchaseOrder,
} from '@/lib/types';
import { useCanMutate } from '@/components/auth/role-context';
import { OrdersByTypeChart } from '@/components/dashboard/merch-charts';

interface Props {
  initialOrders: PurchaseOrder[];
  productTypeOptions: string[];
  usadoByOrder: Record<string, number>;
}

function colorForType(t: string): string {
  return PRODUCT_TYPE_COLORS[t] || '#6873D7';
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

export function OrdenesCompraPage({ initialOrders, productTypeOptions, usadoByOrder }: Props) {
  const router = useRouter();
  const canMutate = useCanMutate();

  const [orders, setOrders] = React.useState(initialOrders);
  React.useEffect(() => setOrders(initialOrders), [initialOrders]);

  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<string>('all');
  const [tab, setTab] = React.useState<'inventario' | 'terminado'>('inventario');
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<PurchaseOrder | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<PurchaseOrder | null>(null);

  // Disponible por orden = comprado − usado. >0 hay inventario; <=0 terminado.
  const disponibleOf = React.useCallback(
    (o: PurchaseOrder) => (o.qtyOrdered || 0) - (usadoByOrder[o.orderId] || 0),
    [usadoByOrder],
  );

  // Base: búsqueda + filtro de tipo (sin el tab).
  const base = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    return orders.filter((o) => {
      if (typeFilter !== 'all' && o.productType !== typeFilter) return false;
      if (!q) return true;
      const hay = `${o.orderId} ${o.article} ${o.supplier || ''} ${o.contact || ''} ${
        o.comments || ''
      }`.toLowerCase();
      return hay.includes(q);
    });
  }, [orders, search, typeFilter]);

  const tabCounts = React.useMemo(() => {
    let inventario = 0;
    let terminado = 0;
    for (const o of base) {
      if (disponibleOf(o) > 0) inventario += 1;
      else terminado += 1;
    }
    return { inventario, terminado };
  }, [base, disponibleOf]);

  const filtered = React.useMemo(
    () =>
      base.filter((o) =>
        tab === 'inventario' ? disponibleOf(o) > 0 : disponibleOf(o) <= 0,
      ),
    [base, tab, disponibleOf],
  );

  // Stats
  const totalInvertido = orders.reduce((acc, o) => acc + (o.totalPrice || 0), 0);
  const merchCount = orders.filter((o) => o.productType === 'Merch').length;
  const snacksCount = orders.filter((o) => o.productType === 'Snacks').length;

  async function handleDelete() {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setConfirmDelete(null);
    const prev = orders;
    setOrders((arr) => arr.filter((o) => o.id !== id));
    try {
      const res = await fetch(`/api/merch/orders/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error');
      toast.success('Orden eliminada');
      router.refresh();
    } catch (err: any) {
      setOrders(prev);
      toast.error('No se pudo eliminar');
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Órdenes de compra
          </h1>
          <p className="text-sm text-muted-foreground">
            Compras de merch y snacks · proveedores, costos y recepción
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Órdenes" value={String(orders.length)} />
          <StatCard label="Total invertido" value={formatMoney(totalInvertido)} />
          <StatCard
            label="Merch"
            value={String(merchCount)}
            color={PRODUCT_TYPE_COLORS.Merch}
          />
          <StatCard
            label="Snacks"
            value={String(snacksCount)}
            color={PRODUCT_TYPE_COLORS.Snacks}
          />
        </div>

        {/* Gráfico: inversión por tipo de producto */}
        <OrdersByTypeChart orders={orders} />

        {/* Tabs: Hay inventario / Terminado */}
        <div className="inline-flex rounded-xl border border-border bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setTab('inventario')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
              tab === 'inventario'
                ? 'bg-card text-foreground shadow-soft'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Hay inventario
            <span
              className={`rounded-full px-1.5 text-xs tabular-nums ${
                tab === 'inventario'
                  ? 'bg-brand-aqua-100 text-brand-aqua-700 dark:bg-brand-aqua-600/30 dark:text-brand-aqua-100'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {tabCounts.inventario}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTab('terminado')}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
              tab === 'terminado'
                ? 'bg-card text-foreground shadow-soft'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Terminado
            <span
              className={`rounded-full px-1.5 text-xs tabular-nums ${
                tab === 'terminado'
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-600/30 dark:text-rose-100'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {tabCounts.terminado}
            </span>
          </button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <div className="shrink-0 rounded-xl bg-brand-blue-100 p-2 text-brand-blue-700 dark:bg-brand-blue-600/20 dark:text-brand-blue-100">
                  <Package className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <CardTitle>Compras registradas</CardTitle>
                  <CardDescription>
                    Editá cada orden: cantidades, costos, proveedor y recepción
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
                {canMutate && (
                  <Button
                    variant="gradient"
                    size="sm"
                    className="shrink-0"
                    onClick={() => setCreating(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Nueva
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {filtered.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center rounded-xl bg-muted/40 p-6 text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  No hay órdenes para mostrar
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Agregá una con el botón "Nueva" o ajustá los filtros.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[1200px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-muted/40 text-left">
                      <Th>Fecha de Compra</Th>
                      <Th>Tipo</Th>
                      <Th>ID Compra</Th>
                      <Th>Artículo</Th>
                      <Th className="text-right">Precio unit</Th>
                      <Th className="text-right">Cant. Comprada</Th>
                      <Th className="text-right">Precio Total</Th>
                      <Th className="text-right">Cant. Llegada</Th>
                      <Th>Fecha de Término</Th>
                      <Th>Proveedor</Th>
                      <Th>Contacto</Th>
                      <Th>Comentarios</Th>
                      <Th className="text-right">Acciones</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((o, i) => {
                      const color = colorForType(o.productType);
                      return (
                        <motion.tr
                          key={o.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(i * 0.015, 0.2) }}
                          className="border-t border-border transition-colors hover:bg-muted/30"
                        >
                          <Td className="whitespace-nowrap text-muted-foreground">
                            {formatDate(o.purchaseDate)}
                          </Td>
                          <Td>
                            <span
                              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                              style={{ background: `${color}1A`, color }}
                            >
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ background: color }}
                              />
                              {o.productType}
                            </span>
                          </Td>
                          <Td className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                            {o.orderId}
                          </Td>
                          <Td className="min-w-[200px] font-medium text-foreground">
                            {o.article}
                          </Td>
                          <Td className="whitespace-nowrap text-right tabular-nums">
                            {formatMoney(o.unitPrice)}
                          </Td>
                          <Td className="text-right tabular-nums">
                            {numOrDash(o.qtyOrdered)}
                          </Td>
                          <Td className="whitespace-nowrap text-right font-semibold tabular-nums">
                            {formatMoney(o.totalPrice)}
                          </Td>
                          <Td className="text-right tabular-nums">
                            {numOrDash(o.qtyArrived)}
                          </Td>
                          <Td className="whitespace-nowrap text-muted-foreground">
                            {formatDate(o.endDate)}
                          </Td>
                          <Td className="whitespace-nowrap">{o.supplier || '—'}</Td>
                          <Td className="whitespace-nowrap text-muted-foreground">
                            {o.contact || '—'}
                          </Td>
                          <Td className="min-w-[160px] text-xs text-muted-foreground">
                            {o.comments || '—'}
                          </Td>
                          <Td>
                            <div className="flex items-center justify-end gap-1">
                              {canMutate && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => setEditing(o)}
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
                                  onClick={() => setConfirmDelete(o)}
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
      </div>

      {/* Crear */}
      <OrderFormDialog
        open={creating}
        onOpenChange={setCreating}
        productTypeOptions={productTypeOptions}
        onSubmitted={(item) => {
          setOrders((arr) => [...arr, item]);
          router.refresh();
        }}
      />

      {/* Editar */}
      <OrderFormDialog
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        order={editing || undefined}
        productTypeOptions={productTypeOptions}
        onSubmitted={(item) => {
          setOrders((arr) => arr.map((x) => (x.id === item.id ? item : x)));
          setEditing(null);
          router.refresh();
        }}
      />

      {/* Confirmar eliminar */}
      <Dialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar orden</DialogTitle>
            <DialogDescription>
              ¿Seguro que querés eliminar la orden{' '}
              <span className="font-semibold text-foreground">
                {confirmDelete?.orderId}
              </span>{' '}
              ({confirmDelete?.article})? Esta acción no se puede deshacer.
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

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className="mt-0.5 font-display text-2xl font-bold tabular-nums"
        style={color ? { color } : undefined}
      >
        {value}
      </p>
    </div>
  );
}

// ============================================================================
// Modal de creación / edición
// ============================================================================
function toNum(s: string): number | undefined {
  if (s.trim() === '') return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function OrderFormDialog({
  open,
  onOpenChange,
  order,
  productTypeOptions,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  order?: PurchaseOrder;
  productTypeOptions: string[];
  onSubmitted: (item: PurchaseOrder) => void;
}) {
  const isEdit = !!order;
  const [loading, setLoading] = React.useState(false);

  const [orderId, setOrderId] = React.useState('');
  const [purchaseDate, setPurchaseDate] = React.useState('');
  const [productType, setProductType] = React.useState<string>(productTypeOptions[0] || 'Merch');
  const [article, setArticle] = React.useState('');
  const [unitPrice, setUnitPrice] = React.useState('');
  const [qtyOrdered, setQtyOrdered] = React.useState('');
  const [totalPrice, setTotalPrice] = React.useState('');
  const [totalTouched, setTotalTouched] = React.useState(false);
  const [qtyArrived, setQtyArrived] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [supplier, setSupplier] = React.useState('');
  const [contact, setContact] = React.useState('');
  const [comments, setComments] = React.useState('');

  React.useEffect(() => {
    if (!open) return;
    setOrderId(order?.orderId || '');
    setPurchaseDate(order?.purchaseDate || '');
    setProductType(order?.productType || productTypeOptions[0] || 'Merch');
    setArticle(order?.article || '');
    setUnitPrice(order?.unitPrice !== undefined ? String(order.unitPrice) : '');
    setQtyOrdered(order?.qtyOrdered !== undefined ? String(order.qtyOrdered) : '');
    setTotalPrice(order?.totalPrice !== undefined ? String(order.totalPrice) : '');
    setTotalTouched(false);
    setQtyArrived(order?.qtyArrived !== undefined ? String(order.qtyArrived) : '');
    setEndDate(order?.endDate || '');
    setSupplier(order?.supplier || '');
    setContact(order?.contact || '');
    setComments(order?.comments || '');
  }, [open, order]);

  // Auto-calcula el total (unit × cant) salvo que el usuario lo edite a mano.
  React.useEffect(() => {
    if (totalTouched) return;
    const u = toNum(unitPrice);
    const q = toNum(qtyOrdered);
    if (u !== undefined && q !== undefined) {
      setTotalPrice(String(Math.round(u * q * 100) / 100));
    }
  }, [unitPrice, qtyOrdered, totalTouched]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!article.trim()) return toast.error('Ingresá el artículo');
    if (!productType) return toast.error('Seleccioná el tipo');

    setLoading(true);
    try {
      const url = isEdit ? `/api/merch/orders/${order!.id}` : '/api/merch/orders';
      const payload = {
        orderId: orderId.trim() || undefined,
        purchaseDate: purchaseDate || null,
        productType,
        article: article.trim(),
        unitPrice: toNum(unitPrice) ?? null,
        qtyOrdered: toNum(qtyOrdered) ?? null,
        totalPrice: toNum(totalPrice) ?? null,
        qtyArrived: toNum(qtyArrived) ?? null,
        endDate: endDate || null,
        supplier: supplier.trim() || null,
        contact: contact.trim() || null,
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
      toast.success(isEdit ? 'Orden actualizada' : 'Orden creada');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'No se pudo guardar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar orden' : 'Nueva orden de compra'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Modificá los datos de esta compra.'
              : 'Registrá una nueva compra de merch o snacks.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo de producto</Label>
              <Select value={productType} onValueChange={setProductType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {productTypeOptions.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Artículo</Label>
              <Input
                value={article}
                onChange={(e) => setArticle(e.target.value)}
                placeholder="Descripción del producto"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Fecha de Compra</Label>
              <Input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Fecha de Término</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Precio unit (S/)</Label>
              <Input
                type="number"
                min={0}
                step="any"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Cant. Comprada</Label>
              <Input
                type="number"
                min={0}
                step="any"
                value={qtyOrdered}
                onChange={(e) => setQtyOrdered(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Precio Total (S/)</Label>
              <Input
                type="number"
                min={0}
                step="any"
                value={totalPrice}
                onChange={(e) => {
                  setTotalTouched(true);
                  setTotalPrice(e.target.value);
                }}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Cant. Llegada</Label>
              <Input
                type="number"
                min={0}
                step="any"
                value={qtyArrived}
                onChange={(e) => setQtyArrived(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Proveedor</Label>
              <Input
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Nombre del proveedor"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Contacto</Label>
              <Input
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="Nombre / teléfono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Comentarios</Label>
            <Input
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Notas de la compra"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="gradient" disabled={loading}>
              {isEdit ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {isEdit ? 'Guardar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
