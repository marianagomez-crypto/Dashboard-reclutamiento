'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Search, Trash2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  STAGE_COLORS,
  type Candidate,
  type EtapaResultado,
  type Stage,
  type StageMovement,
  type Vacancy,
} from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { useCanMutate } from '@/components/auth/role-context';

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
  const canMutate = useCanMutate();
  const [movements, setMovements] = React.useState(initialMovements);
  // Resincroniza el estado local cuando vuelve data fresca del server.
  React.useEffect(() => {
    setMovements(initialMovements);
  }, [initialMovements]);

  const [search, setSearch] = React.useState('');
  const [tab, setTab] = React.useState<'en-proceso' | 'finalizados'>('en-proceso');
  const [confirmDelete, setConfirmDelete] = React.useState<StageMovement | null>(null);

  const candidatesById = React.useMemo(
    () => new Map(candidates.map((c) => [c.id, c])),
    [candidates],
  );
  const vacanciesById = React.useMemo(
    () => new Map(vacancies.map((v) => [v.id, v])),
    [vacancies],
  );

  // Un movimiento es "finalizado" si el candidato asociado ya tiene un estado
  // final cerrado. Si no se encuentra el candidato, se trata como "en proceso".
  const isFinished = React.useCallback(
    (candidateId: string) => {
      const c = candidatesById.get(candidateId);
      if (!c) return false;
      return (
        c.finalStatus === 'Contratado' ||
        c.finalStatus === 'Se cayó' ||
        c.finalStatus === 'No seleccionado'
      );
    },
    [candidatesById],
  );

  // Conteos por categoria (para los badges de los tabs)
  const counts = React.useMemo(() => {
    let enProceso = 0;
    let finalizados = 0;
    for (const m of movements) {
      if (isFinished(m.candidateId)) finalizados += 1;
      else enProceso += 1;
    }
    return { enProceso, finalizados };
  }, [movements, isFinished]);

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    return movements
      .filter((m) => {
        // Filtro por tab (estado del candidato)
        const finished = isFinished(m.candidateId);
        if (tab === 'en-proceso' && finished) return false;
        if (tab === 'finalizados' && !finished) return false;
        // Filtro por búsqueda
        if (!q) return true;
        const c = candidatesById.get(m.candidateId);
        const v = vacanciesById.get(m.vacancyId);
        const hay = `${m.id} ${m.candidateId} ${m.vacancyId} ${m.stage} ${
          c?.name || ''
        } ${v?.title || ''}`.toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => numericMovementId(a.id) - numericMovementId(b.id));
  }, [movements, search, tab, isFinished, candidatesById, vacanciesById]);

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
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <CardTitle>Movimientos de etapas</CardTitle>
              <CardDescription>
                {tab === 'en-proceso'
                  ? 'Candidatos que siguen activos en el proceso de selección'
                  : 'Candidatos cuyo proceso ya terminó (Contratado / Se cayó / No seleccionado)'}
              </CardDescription>
            </div>
            <div className="relative w-full lg:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por candidato, vacante..."
                className="pl-9"
              />
            </div>
          </div>

          {/* Tabs: En proceso / Finalizados */}
          <div className="mt-4 inline-flex rounded-xl border border-border bg-muted/40 p-1">
            <button
              type="button"
              onClick={() => setTab('en-proceso')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                tab === 'en-proceso'
                  ? 'bg-card text-foreground shadow-soft'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              En proceso
              <span
                className={`rounded-full px-1.5 text-xs tabular-nums ${
                  tab === 'en-proceso'
                    ? 'bg-brand-blue-100 text-brand-blue-700 dark:bg-brand-blue-600/30 dark:text-brand-blue-100'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {counts.enProceso}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setTab('finalizados')}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                tab === 'finalizados'
                  ? 'bg-card text-foreground shadow-soft'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Finalizados
              <span
                className={`rounded-full px-1.5 text-xs tabular-nums ${
                  tab === 'finalizados'
                    ? 'bg-brand-aqua-100 text-brand-aqua-700 dark:bg-brand-aqua-600/30 dark:text-brand-aqua-100'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {counts.finalizados}
              </span>
            </button>
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
                            {canMutate ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => setConfirmDelete(m)}
                                aria-label="Eliminar"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
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
