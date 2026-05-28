'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { DollarSign, Pencil, Plus, Search, Trash2 } from 'lucide-react';
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
import type { SalaryRange, Vacancy } from '@/lib/types';

interface Props {
  initialRanges: SalaryRange[];
  vacancies: Vacancy[];
}

// Formato local PEN sin centavos
function formatMoney(n?: number | null): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    maximumFractionDigits: 0,
  }).format(n);
}

function numericVacancyId(id: string): number {
  const m = id?.match(/\d+/);
  return m ? parseInt(m[0], 10) : Number.MAX_SAFE_INTEGER;
}

export function SalaryRangesPage({ initialRanges, vacancies }: Props) {
  const router = useRouter();
  const [ranges, setRanges] = React.useState(initialRanges);
  React.useEffect(() => {
    setRanges(initialRanges);
  }, [initialRanges]);

  const [search, setSearch] = React.useState('');
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<SalaryRange | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<SalaryRange | null>(
    null,
  );

  const vacanciesById = React.useMemo(
    () => new Map(vacancies.map((v) => [v.id, v])),
    [vacancies],
  );

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = !q
      ? ranges
      : ranges.filter((r) => {
          const v = vacanciesById.get(r.vacancyId);
          const hay = `${r.vacancyId} ${v?.title || ''}`.toLowerCase();
          return hay.includes(q);
        });
    return [...list].sort(
      (a, b) => numericVacancyId(a.vacancyId) - numericVacancyId(b.vacancyId),
    );
  }, [ranges, search, vacanciesById]);

  async function handleDelete() {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setConfirmDelete(null);
    const prev = ranges;
    setRanges((arr) => arr.filter((r) => r.id !== id));
    try {
      const res = await fetch(`/api/salary-ranges/${id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as any).error || 'Error');
      toast.success('Rango eliminado');
      router.refresh();
    } catch (err: any) {
      setRanges(prev);
      toast.error(err.message || 'No se pudo eliminar');
    }
  }

  // Stats
  const withBoth = ranges.filter(
    (r) => typeof r.min === 'number' && typeof r.max === 'number',
  );
  const avgMin =
    withBoth.length > 0
      ? Math.round(
          withBoth.reduce((acc, r) => acc + (r.min || 0), 0) / withBoth.length,
        )
      : 0;
  const avgMax =
    withBoth.length > 0
      ? Math.round(
          withBoth.reduce((acc, r) => acc + (r.max || 0), 0) / withBoth.length,
        )
      : 0;

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Rango salarial
          </h1>
          <p className="text-sm text-muted-foreground">
            Bandas salariales por vacante · sincronizadas con Airtable
          </p>
        </div>

        {/* Stats */}
        {ranges.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4 shadow-card">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Vacantes con rango
              </p>
              <p className="mt-0.5 font-display text-2xl font-bold tabular-nums">
                {ranges.length}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-card">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Promedio mínimo
              </p>
              <p className="mt-0.5 font-display text-2xl font-bold tabular-nums">
                {formatMoney(avgMin)}
              </p>
            </div>
            <div className="col-span-2 rounded-xl border border-border bg-card p-4 shadow-card sm:col-span-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Promedio máximo
              </p>
              <p className="mt-0.5 font-display text-2xl font-bold tabular-nums">
                {formatMoney(avgMax)}
              </p>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-brand-aqua-100 p-2 text-brand-aqua-700 dark:bg-brand-aqua-600/20 dark:text-brand-aqua-100">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Bandas salariales</CardTitle>
                  <CardDescription>
                    Edita los rangos mínimo y máximo de cada vacante
                  </CardDescription>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por vacante..."
                    className="pl-9"
                  />
                </div>
                <Button variant="gradient" size="sm" onClick={() => setCreating(true)}>
                  <Plus className="h-4 w-4" />
                  Nuevo
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {filtered.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center rounded-xl bg-muted/40 p-6 text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  No hay rangos para mostrar
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Agregá uno con el botón "Nuevo" o ajustá la búsqueda.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[700px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-muted/40 text-left">
                      <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Vacante
                      </th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Mínimo
                      </th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Máximo
                      </th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Rango
                      </th>
                      <th className="w-[88px] px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r, i) => {
                      const v = vacanciesById.get(r.vacancyId);
                      const range =
                        typeof r.min === 'number' && typeof r.max === 'number'
                          ? r.max - r.min
                          : null;
                      return (
                        <motion.tr
                          key={r.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(i * 0.02, 0.25) }}
                          className="border-t border-border transition-colors hover:bg-muted/30"
                        >
                          <td className="px-3 py-2.5">
                            <p className="font-medium text-foreground">
                              {v?.title || '—'}
                            </p>
                            <p className="text-[11px] font-mono text-muted-foreground">
                              {r.vacancyId}
                            </p>
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums">
                            {formatMoney(r.min)}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums">
                            {formatMoney(r.max)}
                          </td>
                          <td className="px-3 py-2.5 text-right text-xs text-muted-foreground tabular-nums">
                            {range !== null ? formatMoney(range) : '—'}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setEditing(r)}
                                aria-label="Editar"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => setConfirmDelete(r)}
                                aria-label="Eliminar"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
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
      <SalaryRangeFormDialog
        open={creating}
        onOpenChange={setCreating}
        vacancies={vacancies}
        existingVacancyIds={ranges.map((r) => r.vacancyId)}
        onSubmitted={(item) => {
          setRanges((arr) => [item, ...arr]);
          router.refresh();
        }}
      />

      {/* Editar */}
      <SalaryRangeFormDialog
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        range={editing || undefined}
        vacancies={vacancies}
        existingVacancyIds={ranges.map((r) => r.vacancyId)}
        onSubmitted={(item) => {
          setRanges((arr) => arr.map((x) => (x.id === item.id ? item : x)));
          setEditing(null);
          router.refresh();
        }}
      />

      {/* Confirmar eliminar */}
      <Dialog
        open={!!confirmDelete}
        onOpenChange={(v) => !v && setConfirmDelete(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar rango salarial</DialogTitle>
            <DialogDescription>
              ¿Seguro que querés eliminar el rango de{' '}
              <span className="font-semibold text-foreground">
                {confirmDelete?.vacancyId}
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

// ============================================================================
// Modal de creación / edición
// ============================================================================
function SalaryRangeFormDialog({
  open,
  onOpenChange,
  range,
  vacancies,
  existingVacancyIds,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  range?: SalaryRange;
  vacancies: Vacancy[];
  existingVacancyIds: string[];
  onSubmitted: (item: SalaryRange) => void;
}) {
  const isEdit = !!range;
  const [loading, setLoading] = React.useState(false);

  const [vacancyId, setVacancyId] = React.useState(range?.vacancyId || '');
  const [min, setMin] = React.useState<string>(
    range?.min !== undefined ? String(range.min) : '',
  );
  const [max, setMax] = React.useState<string>(
    range?.max !== undefined ? String(range.max) : '',
  );

  React.useEffect(() => {
    if (!open) return;
    setVacancyId(range?.vacancyId || '');
    setMin(range?.min !== undefined ? String(range.min) : '');
    setMax(range?.max !== undefined ? String(range.max) : '');
  }, [open, range]);

  // Para create: ocultar vacantes que ya tienen rango (1 rango por vacante).
  // Para edit: dejarlas todas (la actual debe seguir disponible).
  const availableVacancies = React.useMemo(() => {
    if (isEdit) return vacancies;
    const used = new Set(existingVacancyIds);
    return vacancies.filter((v) => !used.has(v.id));
  }, [vacancies, existingVacancyIds, isEdit]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vacancyId) {
      toast.error('Seleccioná una vacante');
      return;
    }
    const minN = min === '' ? undefined : Number(min);
    const maxN = max === '' ? undefined : Number(max);
    if (minN !== undefined && !Number.isFinite(minN)) {
      toast.error('Mínimo inválido');
      return;
    }
    if (maxN !== undefined && !Number.isFinite(maxN)) {
      toast.error('Máximo inválido');
      return;
    }
    if (minN !== undefined && maxN !== undefined && minN > maxN) {
      toast.error('El mínimo no puede ser mayor que el máximo');
      return;
    }

    setLoading(true);
    try {
      const url = isEdit ? `/api/salary-ranges/${range!.id}` : '/api/salary-ranges';
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vacancyId,
          min: minN,
          max: maxN,
        }),
      });
      const json = await res.json().catch(() => ({ error: `Error ${res.status}` }));
      if (!res.ok) throw new Error((json as any).error || 'Error');
      onSubmitted((json as any).data);
      toast.success(isEdit ? 'Rango actualizado' : 'Rango creado');
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
          <DialogTitle>
            {isEdit ? 'Editar rango salarial' : 'Nuevo rango salarial'}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Modificá la banda salarial de esta vacante.'
              : 'Definí los salarios mínimo y máximo para una vacante.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Vacante</Label>
            <Select
              value={vacancyId}
              onValueChange={setVacancyId}
              disabled={isEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar vacante" />
              </SelectTrigger>
              <SelectContent>
                {availableVacancies.length === 0 ? (
                  <SelectItem value="__none" disabled>
                    Todas las vacantes ya tienen rango
                  </SelectItem>
                ) : (
                  availableVacancies.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.id} · {v.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {isEdit && (
              <p className="text-[11px] text-muted-foreground">
                La vacante no se puede cambiar desde acá. Eliminá y recreá el
                rango si necesitás moverlo.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Salario mínimo (S/)</Label>
              <Input
                type="number"
                min={0}
                step="any"
                value={min}
                onChange={(e) => setMin(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Salario máximo (S/)</Label>
              <Input
                type="number"
                min={0}
                step="any"
                value={max}
                onChange={(e) => setMax(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
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
