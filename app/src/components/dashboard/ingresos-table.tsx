'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { LogIn, Pencil, Plus, Search, Trash2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
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
import { Switch } from '@/components/ui/switch';
import type { Candidate, Ingreso } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface Props {
  initialIngresos: Ingreso[];
  candidates: Candidate[];
}

function formatMoney(n?: number | null): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    maximumFractionDigits: 0,
  }).format(n);
}

function numericCandidateId(id: string): number {
  const m = id?.match(/\d+/);
  return m ? parseInt(m[0], 10) : Number.MAX_SAFE_INTEGER;
}

export function IngresosTable({ initialIngresos, candidates }: Props) {
  const router = useRouter();
  const [ingresos, setIngresos] = React.useState(initialIngresos);
  React.useEffect(() => {
    setIngresos(initialIngresos);
  }, [initialIngresos]);

  const [search, setSearch] = React.useState('');
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<Ingreso | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<Ingreso | null>(null);

  const candidatesById = React.useMemo(
    () => new Map(candidates.map((c) => [c.id, c])),
    [candidates],
  );

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = !q
      ? ingresos
      : ingresos.filter((i) => {
          const c = candidatesById.get(i.candidateId);
          const hay = `${i.candidateId} ${c?.name || ''}`.toLowerCase();
          return hay.includes(q);
        });
    return [...list].sort(
      (a, b) => numericCandidateId(a.candidateId) - numericCandidateId(b.candidateId),
    );
  }, [ingresos, search, candidatesById]);

  async function handleDelete() {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setConfirmDelete(null);
    const prev = ingresos;
    setIngresos((arr) => arr.filter((i) => i.id !== id));
    try {
      const res = await fetch(`/api/ingresos/${id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as any).error || 'Error');
      toast.success('Ingreso eliminado');
      router.refresh();
    } catch (err: any) {
      setIngresos(prev);
      toast.error(err.message || 'No se pudo eliminar');
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-brand-gold-100 p-2 text-brand-gold-700 dark:bg-brand-gold-600/20 dark:text-brand-gold-100">
                <LogIn className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Ingresos</CardTitle>
                <CardDescription>
                  Tracking post-contratación · {ingresos.length} registros
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por candidato..."
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
                No hay ingresos para mostrar
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Agregá uno con el botón "Nuevo" o ajustá la búsqueda.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[960px] border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/40 text-left">
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Candidato
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Salario final
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Ingreso
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Sigue
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Salida
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Periodo prueba
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Comentario
                    </th>
                    <th className="w-[88px] px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((i, idx) => {
                    const c = candidatesById.get(i.candidateId);
                    return (
                      <motion.tr
                        key={i.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(idx * 0.02, 0.25) }}
                        className="border-t border-border transition-colors hover:bg-muted/30"
                      >
                        <td className="px-3 py-2.5">
                          <p className="font-medium text-foreground">
                            {c?.name || '—'}
                          </p>
                          <p className="text-[11px] font-mono text-muted-foreground">
                            {i.candidateId}
                          </p>
                        </td>
                        <td className="px-3 py-2.5 text-right tabular-nums">
                          {formatMoney(i.finalSalary)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground tabular-nums">
                          {i.startDate ? formatDate(i.startDate) : '—'}
                        </td>
                        <td className="px-3 py-2.5">
                          {i.stillEmployed === true ? (
                            <Badge variant="success">Sí</Badge>
                          ) : i.stillEmployed === false ? (
                            <Badge variant="destructive">No</Badge>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground tabular-nums">
                          {i.endDate ? (
                            formatDate(i.endDate)
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {i.passedProbation === true ? (
                            <Badge variant="success">Pasó</Badge>
                          ) : i.passedProbation === false ? (
                            <Badge variant="warning">No pasó</Badge>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>
                        <td className="max-w-xs px-3 py-2.5">
                          <p
                            className="truncate text-xs text-muted-foreground"
                            title={i.leaderComment || ''}
                          >
                            {i.leaderComment || '—'}
                          </p>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setEditing(i)}
                              aria-label="Editar"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => setConfirmDelete(i)}
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

      {/* Crear */}
      <IngresoFormDialog
        open={creating}
        onOpenChange={setCreating}
        candidates={candidates}
        existingCandidateIds={ingresos.map((i) => i.candidateId)}
        onSubmitted={(item) => {
          setIngresos((arr) => [item, ...arr]);
          router.refresh();
        }}
      />

      {/* Editar */}
      <IngresoFormDialog
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        ingreso={editing || undefined}
        candidates={candidates}
        existingCandidateIds={ingresos.map((i) => i.candidateId)}
        onSubmitted={(item) => {
          setIngresos((arr) => arr.map((x) => (x.id === item.id ? item : x)));
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
            <DialogTitle>Eliminar ingreso</DialogTitle>
            <DialogDescription>
              ¿Seguro que querés eliminar el ingreso de{' '}
              <span className="font-semibold text-foreground">
                {candidatesById.get(confirmDelete?.candidateId || '')?.name ||
                  confirmDelete?.candidateId}
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
function IngresoFormDialog({
  open,
  onOpenChange,
  ingreso,
  candidates,
  existingCandidateIds,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  ingreso?: Ingreso;
  candidates: Candidate[];
  existingCandidateIds: string[];
  onSubmitted: (item: Ingreso) => void;
}) {
  const isEdit = !!ingreso;
  const [loading, setLoading] = React.useState(false);

  // En crear: ocultar candidatos que ya tienen un ingreso (1 ingreso por candidato).
  // En editar: mostrar todos para que el actual siga visible/seleccionado.
  const availableCandidates = React.useMemo(() => {
    if (isEdit) return candidates;
    const used = new Set(existingCandidateIds);
    return candidates.filter((c) => !used.has(c.id));
  }, [candidates, existingCandidateIds, isEdit]);

  const [candidateId, setCandidateId] = React.useState(ingreso?.candidateId || '');
  const [salary, setSalary] = React.useState<string>(
    ingreso?.finalSalary !== undefined ? String(ingreso.finalSalary) : '',
  );
  const [startDate, setStartDate] = React.useState(
    ingreso?.startDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = React.useState(ingreso?.endDate?.slice(0, 10) || '');
  const [stillEmployed, setStillEmployed] = React.useState<boolean>(
    ingreso?.stillEmployed ?? true,
  );
  const [passedProbation, setPassedProbation] = React.useState<string>(
    ingreso?.passedProbation === true
      ? 'yes'
      : ingreso?.passedProbation === false
        ? 'no'
        : 'unknown',
  );
  const [leaderComment, setLeaderComment] = React.useState(
    ingreso?.leaderComment || '',
  );

  React.useEffect(() => {
    if (!open) return;
    setCandidateId(ingreso?.candidateId || '');
    setSalary(ingreso?.finalSalary !== undefined ? String(ingreso.finalSalary) : '');
    setStartDate(
      ingreso?.startDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    );
    setEndDate(ingreso?.endDate?.slice(0, 10) || '');
    setStillEmployed(ingreso?.stillEmployed ?? true);
    setPassedProbation(
      ingreso?.passedProbation === true
        ? 'yes'
        : ingreso?.passedProbation === false
          ? 'no'
          : 'unknown',
    );
    setLeaderComment(ingreso?.leaderComment || '');
  }, [open, ingreso]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!candidateId) {
      toast.error('Seleccioná un candidato');
      return;
    }
    const salaryN = salary === '' ? undefined : Number(salary);
    if (salaryN !== undefined && !Number.isFinite(salaryN)) {
      toast.error('Salario inválido');
      return;
    }

    const payload: Record<string, any> = {
      candidateId,
      finalSalary: salaryN,
      startDate,
      endDate: endDate || null,
      stillEmployed,
      leaderComment: leaderComment || null,
    };
    if (passedProbation !== 'unknown') {
      payload.passedProbation = passedProbation === 'yes';
    } else {
      payload.passedProbation = null;
    }

    setLoading(true);
    try {
      const url = isEdit ? `/api/ingresos/${ingreso!.id}` : '/api/ingresos';
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({ error: `Error ${res.status}` }));
      if (!res.ok) throw new Error((json as any).error || 'Error');
      onSubmitted((json as any).data);
      toast.success(isEdit ? 'Ingreso actualizado' : 'Ingreso creado');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'No se pudo guardar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar ingreso' : 'Nuevo ingreso'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Modificá los datos post-contratación del candidato.'
              : 'Registra un nuevo ingreso de candidato a la empresa.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Candidato</Label>
              <Select value={candidateId} onValueChange={setCandidateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar candidato" />
                </SelectTrigger>
                <SelectContent>
                  {availableCandidates.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      Todos los candidatos ya tienen ingreso
                    </SelectItem>
                  ) : (
                    availableCandidates.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.id} · {c.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Salario final (S/)</Label>
              <Input
                type="number"
                min={0}
                step="100"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Periodo de prueba</Label>
              <Select value={passedProbation} onValueChange={setPassedProbation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unknown">Sin definir</SelectItem>
                  <SelectItem value="yes">Pasó</SelectItem>
                  <SelectItem value="no">No pasó</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fecha de ingreso</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Fecha de salida</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="col-span-2 flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">¿Sigue en la empresa?</p>
                <p className="text-xs text-muted-foreground">
                  Si marcás "No", llená la fecha de salida.
                </p>
              </div>
              <Switch checked={stillEmployed} onCheckedChange={setStillEmployed} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Comentario del líder</Label>
              <Input
                value={leaderComment}
                onChange={(e) => setLeaderComment(e.target.value)}
                placeholder="Notas, performance, observaciones..."
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
