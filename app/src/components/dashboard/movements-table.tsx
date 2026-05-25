'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
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
import {
  STAGES,
  STAGE_COLORS,
  type Candidate,
  type EtapaResultado,
  type Stage,
  type StageMovement,
  type Vacancy,
} from '@/lib/types';
import { formatDate } from '@/lib/utils';

const RESULTS: EtapaResultado[] = ['Aprobado', 'Aceptó Oferta', 'No se presentó'];

const RESULT_BADGE: Record<EtapaResultado, 'success' | 'destructive' | 'outline'> = {
  Aprobado: 'success',
  'Aceptó Oferta': 'success',
  'No se presentó': 'destructive',
};

interface Props {
  initialMovements: StageMovement[];
  candidates: Candidate[];
  vacancies: Vacancy[];
}

function numericMovementId(id: string): number {
  const m = id?.match(/\d+/);
  return m ? parseInt(m[0], 10) : Number.MAX_SAFE_INTEGER;
}

export function MovementsTable({
  initialMovements,
  candidates,
  vacancies,
}: Props) {
  const router = useRouter();
  const [movements, setMovements] = React.useState(initialMovements);
  // Resincroniza el estado local cuando vuelve data fresca del server.
  React.useEffect(() => {
    setMovements(initialMovements);
  }, [initialMovements]);

  const [search, setSearch] = React.useState('');
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<StageMovement | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<StageMovement | null>(null);

  const candidatesById = React.useMemo(
    () => new Map(candidates.map((c) => [c.id, c])),
    [candidates],
  );
  const vacanciesById = React.useMemo(
    () => new Map(vacancies.map((v) => [v.id, v])),
    [vacancies],
  );

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = !q
      ? movements
      : movements.filter((m) => {
          const c = candidatesById.get(m.candidateId);
          const v = vacanciesById.get(m.vacancyId);
          const hay = `${m.id} ${m.candidateId} ${m.vacancyId} ${m.stage} ${
            c?.name || ''
          } ${v?.title || ''}`.toLowerCase();
          return hay.includes(q);
        });
    return [...list].sort(
      (a, b) => numericMovementId(a.id) - numericMovementId(b.id),
    );
  }, [movements, search, candidatesById, vacanciesById]);

  async function handleDelete() {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setConfirmDelete(null);
    const prev = movements;
    setMovements((arr) => arr.filter((m) => m.id !== id));
    try {
      const res = await fetch(`/api/movements/${id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as any).error || 'Error');
      toast.success('Movimiento eliminado');
      router.refresh();
    } catch (err: any) {
      setMovements(prev);
      toast.error(err.message || 'No se pudo eliminar');
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle>Movimientos de etapas</CardTitle>
              <CardDescription>
                {movements.length} registros · historial completo de etapas por
                candidato
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por candidato, vacante..."
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
                No hay movimientos para mostrar
              </p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Creá uno con el botón "Nuevo" o ajustá el filtro de búsqueda.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[1000px] border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/40 text-left">
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      ID Mov
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Candidato
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Vacante
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Etapa
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Inicio
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Fin
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Resultado
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Comentarios
                    </th>
                    <th className="w-[88px] px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m, i) => {
                    const c = candidatesById.get(m.candidateId);
                    const v = vacanciesById.get(m.vacancyId);
                    return (
                      <motion.tr
                        key={m.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.012, 0.25) }}
                        className="border-t border-border transition-colors hover:bg-muted/30"
                      >
                        <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-muted-foreground">
                          {m.id}
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="font-medium text-foreground">
                            {c?.name || '—'}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {m.candidateId}
                          </p>
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="font-medium text-foreground">
                            {v?.title || '—'}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {m.vacancyId}
                          </p>
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                            style={{
                              background: `${STAGE_COLORS[m.stage as Stage] || '#888'}22`,
                              color: STAGE_COLORS[m.stage as Stage] || '#666',
                            }}
                          >
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{
                                background: STAGE_COLORS[m.stage as Stage] || '#888',
                              }}
                            />
                            {m.stage}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground tabular-nums">
                          {m.startedAt ? formatDate(m.startedAt) : '—'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground tabular-nums">
                          {m.endedAt ? formatDate(m.endedAt) : (
                            <span className="text-muted-foreground/40">en curso</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {m.result ? (
                            <Badge variant={RESULT_BADGE[m.result] || 'outline'}>
                              {m.result}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 max-w-xs">
                          <p
                            className="truncate text-xs text-muted-foreground"
                            title={m.comments || ''}
                          >
                            {m.comments || '—'}
                          </p>
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => setEditing(m)}
                              aria-label="Editar"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => setConfirmDelete(m)}
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
      <MovementFormDialog
        open={creating}
        onOpenChange={setCreating}
        candidates={candidates}
        vacancies={vacancies}
        onSubmitted={(m) => {
          setMovements((arr) => [m, ...arr]);
          router.refresh();
        }}
      />

      {/* Editar */}
      <MovementFormDialog
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        movement={editing || undefined}
        candidates={candidates}
        vacancies={vacancies}
        onSubmitted={(m) => {
          setMovements((arr) => arr.map((x) => (x.id === m.id ? m : x)));
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
            <DialogTitle>Eliminar movimiento</DialogTitle>
            <DialogDescription>
              ¿Seguro que querés eliminar el movimiento{' '}
              <span className="font-mono">{confirmDelete?.id}</span>? Esta acción
              no se puede deshacer.
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
function MovementFormDialog({
  open,
  onOpenChange,
  movement,
  candidates,
  vacancies,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  movement?: StageMovement;
  candidates: Candidate[];
  vacancies: Vacancy[];
  onSubmitted: (m: StageMovement) => void;
}) {
  const isEdit = !!movement;
  const [loading, setLoading] = React.useState(false);

  // Estado controlado para que se reinicialice cuando cambia "movement"
  const [candidateId, setCandidateId] = React.useState(movement?.candidateId || '');
  const [vacancyId, setVacancyId] = React.useState(movement?.vacancyId || '');
  const [stage, setStage] = React.useState<string>(movement?.stage || 'Screening');
  const [startedAt, setStartedAt] = React.useState(
    movement?.startedAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
  );
  const [endedAt, setEndedAt] = React.useState(movement?.endedAt?.slice(0, 10) || '');
  const [result, setResult] = React.useState<string>(movement?.result || 'none');
  const [comments, setComments] = React.useState(movement?.comments || '');

  React.useEffect(() => {
    if (!open) return;
    setCandidateId(movement?.candidateId || '');
    setVacancyId(movement?.vacancyId || '');
    setStage(movement?.stage || 'Screening');
    setStartedAt(
      movement?.startedAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    );
    setEndedAt(movement?.endedAt?.slice(0, 10) || '');
    setResult(movement?.result || 'none');
    setComments(movement?.comments || '');
  }, [open, movement]);

  // Auto-rellena vacancyId cuando se selecciona candidato (si tiene asociada)
  React.useEffect(() => {
    if (!candidateId || isEdit) return;
    const c = candidates.find((x) => x.id === candidateId);
    if (c?.vacancyId) setVacancyId(c.vacancyId);
  }, [candidateId, candidates, isEdit]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const payload = {
      candidateId,
      vacancyId,
      stage,
      startedAt,
      endedAt: endedAt || null,
      result: result === 'none' ? null : result,
      comments: comments || null,
    };
    try {
      const url = isEdit ? `/api/movements/${movement!.id}` : '/api/movements';
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({ error: `Error ${res.status}` }));
      if (!res.ok) throw new Error((json as any).error || 'Error');
      onSubmitted((json as any).data);
      toast.success(isEdit ? 'Movimiento actualizado' : 'Movimiento creado');
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
          <DialogTitle>{isEdit ? 'Editar movimiento' : 'Nuevo movimiento'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? `Editando ${movement!.id}. Los cambios se sincronizan con Airtable.`
              : 'Registra un nuevo movimiento de etapa en el historial.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Candidato</Label>
              <Select value={candidateId} onValueChange={setCandidateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar candidato" />
                </SelectTrigger>
                <SelectContent>
                  {candidates.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.id} · {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Vacante</Label>
              <Select value={vacancyId} onValueChange={setVacancyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar vacante" />
                </SelectTrigger>
                <SelectContent>
                  {vacancies.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.id} · {v.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Etapa</Label>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Resultado</Label>
              <Select value={result} onValueChange={setResult}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin resultado</SelectItem>
                  {RESULTS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fecha inicio</Label>
              <Input
                type="date"
                value={startedAt}
                onChange={(e) => setStartedAt(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Fecha fin</Label>
              <Input
                type="date"
                value={endedAt}
                onChange={(e) => setEndedAt(e.target.value)}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Comentarios</Label>
              <Input
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Notas del movimiento (opcional)"
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
