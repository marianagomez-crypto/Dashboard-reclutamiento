'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Pencil, Plus, Search, Trash2, Truck } from 'lucide-react';
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
  MERCH_EXPENSE_TYPES,
  MERCH_EXPENSE_TYPE_COLORS,
  MERCH_OCCASIONS,
  MERCH_OCCASION_COLORS,
  type MerchExtraExpense,
} from '@/lib/types';
import { useCanMutate } from '@/components/auth/role-context';

function colorForType(t?: string): string {
  return (t && MERCH_EXPENSE_TYPE_COLORS[t]) || '#6B7280';
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

export function GastosExtraTable({
  initialExpenses,
}: {
  initialExpenses: MerchExtraExpense[];
}) {
  const router = useRouter();
  const canMutate = useCanMutate();

  const [expenses, setExpenses] = React.useState(initialExpenses);
  React.useEffect(() => setExpenses(initialExpenses), [initialExpenses]);

  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<string>('all');
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<MerchExtraExpense | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<MerchExtraExpense | null>(null);

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    return expenses
      .filter((e) => {
        if (typeFilter !== 'all' && e.expenseType !== typeFilter) return false;
        if (!q) return true;
        const hay = `${e.name || ''} ${e.expenseType || ''} ${e.occasion || ''} ${
          e.event || ''
        }`.toLowerCase();
        return hay.includes(q);
      })
      // Fecha más reciente primero; los sin fecha al tope.
      .sort((a, b) => (b.date || '9999-12-31').localeCompare(a.date || '9999-12-31'));
  }, [expenses, search, typeFilter]);

  const totalGastos = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  async function handleDelete() {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setConfirmDelete(null);
    const prev = expenses;
    setExpenses((arr) => arr.filter((e) => e.id !== id));
    try {
      const res = await fetch(`/api/merch/expenses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error');
      toast.success('Gasto eliminado');
      router.refresh();
    } catch {
      setExpenses(prev);
      toast.error('No se pudo eliminar');
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="shrink-0 rounded-xl bg-brand-gold-100 p-2 text-brand-gold-700 dark:bg-brand-gold-600/20 dark:text-brand-gold-100">
                <Truck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <CardTitle>Gastos extra</CardTitle>
                <CardDescription>
                  Transporte, envío, impresión… · {formatMoney(totalGastos)} en total ·
                  no consumen stock
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
                <SelectTrigger className="w-[160px] shrink-0">
                  <SelectValue placeholder="Tipo de gasto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {MERCH_EXPENSE_TYPES.map((t) => (
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
                  Nuevo gasto
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filtered.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center rounded-xl bg-muted/40 p-6 text-center">
              <p className="text-sm font-medium text-muted-foreground">
                No hay gastos extra para mostrar
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Registrá uno con "Nuevo gasto" (transporte, envío, etc.).
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[820px] border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/40 text-left">
                    <Th>Fecha</Th>
                    <Th>Tipo de gasto</Th>
                    <Th>Nombre de gasto</Th>
                    <Th>Ocasión</Th>
                    <Th>Evento específico</Th>
                    <Th className="text-right">Monto</Th>
                    <Th className="text-right">Acciones</Th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e, i) => {
                    const tColor = colorForType(e.expenseType);
                    const oColor = colorForOccasion(e.occasion);
                    return (
                      <motion.tr
                        key={e.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.015, 0.2) }}
                        className="border-t border-border transition-colors hover:bg-muted/30"
                      >
                        <Td className="whitespace-nowrap text-muted-foreground">
                          {formatDate(e.date)}
                        </Td>
                        <Td>
                          {e.expenseType ? (
                            <span
                              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                              style={{ background: `${tColor}1A`, color: tColor }}
                            >
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ background: tColor }}
                              />
                              {e.expenseType}
                            </span>
                          ) : (
                            '—'
                          )}
                        </Td>
                        <Td className="min-w-[180px] font-medium text-foreground">
                          {e.name || '—'}
                        </Td>
                        <Td>
                          {e.occasion ? (
                            <span
                              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                              style={{ background: `${oColor}1A`, color: oColor }}
                            >
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ background: oColor }}
                              />
                              {e.occasion}
                            </span>
                          ) : (
                            '—'
                          )}
                        </Td>
                        <Td className="min-w-[160px] max-w-[260px] text-xs text-muted-foreground">
                          {e.event ? (
                            <span className="block truncate" title={e.event}>
                              {e.event}
                            </span>
                          ) : (
                            '—'
                          )}
                        </Td>
                        <Td className="whitespace-nowrap text-right font-semibold tabular-nums">
                          {formatMoney(e.amount)}
                        </Td>
                        <Td>
                          <div className="flex items-center justify-end gap-1">
                            {canMutate && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setEditing(e)}
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
                                onClick={() => setConfirmDelete(e)}
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

      <ExpenseFormDialog
        open={creating}
        onOpenChange={setCreating}
        onSubmitted={(item) => {
          setExpenses((arr) => [...arr, item]);
          router.refresh();
        }}
      />

      <ExpenseFormDialog
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        expense={editing || undefined}
        onSubmitted={(item) => {
          setExpenses((arr) => arr.map((x) => (x.id === item.id ? item : x)));
          setEditing(null);
          router.refresh();
        }}
      />

      <Dialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar gasto</DialogTitle>
            <DialogDescription>
              ¿Seguro que querés eliminar el gasto{' '}
              <span className="font-semibold text-foreground">
                {confirmDelete?.name || confirmDelete?.expenseType}
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

function ExpenseFormDialog({
  open,
  onOpenChange,
  expense,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  expense?: MerchExtraExpense;
  onSubmitted: (item: MerchExtraExpense) => void;
}) {
  const isEdit = !!expense;
  const [loading, setLoading] = React.useState(false);

  const [expenseType, setExpenseType] = React.useState<string>('Transporte');
  const [name, setName] = React.useState('');
  const [date, setDate] = React.useState('');
  const [occasion, setOccasion] = React.useState<string>('Focus Group');
  const [event, setEvent] = React.useState('');
  const [amount, setAmount] = React.useState('');

  React.useEffect(() => {
    if (!open) return;
    setExpenseType(expense?.expenseType || 'Transporte');
    setName(expense?.name || '');
    setDate(expense?.date || '');
    setOccasion(expense?.occasion || 'Focus Group');
    setEvent(expense?.event || '');
    setAmount(expense?.amount !== undefined ? String(expense.amount) : '');
  }, [open, expense]);

  const amountNum = toNum(amount);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error('Ingresá el nombre del gasto');
    if (amountNum === undefined || amountNum <= 0)
      return toast.error('Ingresá un monto válido');

    setLoading(true);
    try {
      const url = isEdit ? `/api/merch/expenses/${expense!.id}` : '/api/merch/expenses';
      const payload = {
        name: name.trim() || null,
        expenseType: expenseType || null,
        date: date || null,
        occasion: occasion || null,
        event: event.trim() || null,
        amount: amountNum ?? null,
      };
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({ error: `Error ${res.status}` }));
      if (!res.ok) throw new Error((json as any).error || 'Error');
      onSubmitted((json as any).data);
      toast.success(isEdit ? 'Gasto actualizado' : 'Gasto registrado');
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
          <DialogTitle>{isEdit ? 'Editar gasto' : 'Nuevo gasto extra'}</DialogTitle>
          <DialogDescription>
            Gastos que no consumen stock (transporte, envío, impresión…).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo de gasto</Label>
              <Select value={expenseType} onValueChange={setExpenseType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MERCH_EXPENSE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Monto (S/)</Label>
              <Input
                type="number"
                min={0}
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Nombre de gasto</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Flete activación Lima, Envío Olva…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Fecha</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
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
            <Input
              value={event}
              onChange={(e) => setEvent(e.target.value)}
              placeholder="Ej: Aniversario empresa, Día del trabajador…"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="gradient" disabled={loading}>
              {isEdit ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {isEdit ? 'Guardar' : 'Registrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
