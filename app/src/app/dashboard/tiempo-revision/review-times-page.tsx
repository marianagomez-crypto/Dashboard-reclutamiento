'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Clock, Pencil, Plus, Search, Trash2 } from 'lucide-react';
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
import type { Candidate, ReviewTime } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { useCanMutate, useIsAdmin } from '@/components/auth/role-context';

interface Props {
  initialReviews: ReviewTime[];
  candidates: Candidate[];
  headOptions: string[];
}

// Dias entre envío y retorno del CV (null si falta alguna fecha o es invalido)
function daysBetween(sent?: string, back?: string): number | null {
  if (!sent || !back) return null;
  const s = new Date(sent).getTime();
  const b = new Date(back).getTime();
  if (!Number.isFinite(s) || !Number.isFinite(b)) return null;
  const d = Math.round((b - s) / 86_400_000);
  return d >= 0 ? d : null;
}

function numericReviewId(id?: string): number {
  const m = id?.match(/\d+/);
  return m ? parseInt(m[0], 10) : Number.MAX_SAFE_INTEGER;
}

export function ReviewTimesPage({ initialReviews, candidates, headOptions }: Props) {
  const router = useRouter();
  const canMutate = useCanMutate();
  const isAdmin = useIsAdmin();
  const [reviews, setReviews] = React.useState(initialReviews);
  React.useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

  const [search, setSearch] = React.useState('');
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<ReviewTime | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<ReviewTime | null>(null);

  const candidatesById = React.useMemo(
    () => new Map(candidates.map((c) => [c.id, c])),
    [candidates],
  );

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = !q
      ? reviews
      : reviews.filter((r) => {
          const c = candidatesById.get(r.candidateId || '');
          const hay = `${r.reviewId || ''} ${r.candidateId || ''} ${
            r.headName || ''
          } ${c?.name || ''}`.toLowerCase();
          return hay.includes(q);
        });
    return [...list].sort(
      (a, b) => numericReviewId(a.reviewId) - numericReviewId(b.reviewId),
    );
  }, [reviews, search, candidatesById]);

  async function handleDelete() {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setConfirmDelete(null);
    const prev = reviews;
    setReviews((arr) => arr.filter((r) => r.id !== id));
    try {
      const res = await fetch(`/api/review-times/${id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as any).error || 'Error');
      toast.success('Registro eliminado');
      router.refresh();
    } catch (err: any) {
      setReviews(prev);
      toast.error(err.message || 'No se pudo eliminar');
    }
  }

  // Stats: promedio global de días + registros completos
  const withDays = reviews
    .map((r) => daysBetween(r.cvSentAt, r.returnedAt))
    .filter((d): d is number => d !== null);
  const avgDays =
    withDays.length > 0
      ? Math.round((withDays.reduce((a, b) => a + b, 0) / withDays.length) * 10) / 10
      : 0;

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Tiempo de revisión
          </h1>
          <p className="text-sm text-muted-foreground">
            Días que tarda cada Hiring Manager en revisar un CV
          </p>
        </div>

        {/* Stats */}
        {reviews.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4 shadow-card">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Revisiones
              </p>
              <p className="mt-0.5 font-display text-2xl font-bold tabular-nums">
                {reviews.length}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-card">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Promedio días
              </p>
              <p className="mt-0.5 font-display text-2xl font-bold tabular-nums">
                {avgDays} d
              </p>
            </div>
            <div className="col-span-2 rounded-xl border border-border bg-card p-4 shadow-card sm:col-span-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Con fechas completas
              </p>
              <p className="mt-0.5 font-display text-2xl font-bold tabular-nums">
                {withDays.length}/{reviews.length}
              </p>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <div className="shrink-0 rounded-xl bg-brand-aqua-100 p-2 text-brand-aqua-700 dark:bg-brand-aqua-600/20 dark:text-brand-aqua-100">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <CardTitle>Revisiones de CV</CardTitle>
                  <CardDescription>
                    Editá envío, retorno y responsable de cada revisión
                  </CardDescription>
                </div>
              </div>
              <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
                <div className="relative min-w-0 flex-1 lg:w-64 lg:flex-none">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar por candidato, head..."
                    className="pl-9"
                  />
                </div>
                {canMutate && (
                  <Button
                    variant="gradient"
                    size="sm"
                    className="shrink-0"
                    onClick={() => setCreating(true)}
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
                  No hay revisiones para mostrar
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Agregá una con el botón "Nuevo" o ajustá la búsqueda.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[760px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-muted/40 text-left">
                      <th className="w-20 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        ID
                      </th>
                      <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Candidato
                      </th>
                      <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Hiring Manager
                      </th>
                      <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Envío CV
                      </th>
                      <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Retorno CV
                      </th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Días
                      </th>
                      <th className="w-[88px] px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r, i) => {
                      const c = candidatesById.get(r.candidateId || '');
                      const days = daysBetween(r.cvSentAt, r.returnedAt);
                      const dayVariant =
                        days === null
                          ? 'outline'
                          : days <= 2
                            ? 'success'
                            : days <= 5
                              ? 'blue'
                              : 'destructive';
                      return (
                        <motion.tr
                          key={r.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(i * 0.02, 0.25) }}
                          className="border-t border-border transition-colors hover:bg-muted/30"
                        >
                          <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-muted-foreground">
                            {r.reviewId || '—'}
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="font-medium text-foreground">
                              {c?.name || '—'}
                            </p>
                            <p className="text-[11px] font-mono text-muted-foreground">
                              {r.candidateId}
                            </p>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-foreground">
                            {r.headName || '—'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground tabular-nums">
                            {r.cvSentAt ? formatDate(r.cvSentAt) : '—'}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground tabular-nums">
                            {r.returnedAt ? formatDate(r.returnedAt) : '—'}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            {days === null ? (
                              <span className="text-muted-foreground/40">—</span>
                            ) : (
                              <Badge variant={dayVariant as any}>
                                {days} {days === 1 ? 'día' : 'días'}
                              </Badge>
                            )}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center justify-end gap-1">
                              {canMutate && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => setEditing(r)}
                                  aria-label="Editar"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => setConfirmDelete(r)}
                                  aria-label="Eliminar"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {!canMutate && !isAdmin && (
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
      </div>

      {/* Crear */}
      <ReviewFormDialog
        open={creating}
        onOpenChange={setCreating}
        candidates={candidates}
        headOptions={headOptions}
        onSubmitted={(item) => {
          setReviews((arr) => [item, ...arr]);
          router.refresh();
        }}
      />

      {/* Editar */}
      <ReviewFormDialog
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        review={editing || undefined}
        candidates={candidates}
        headOptions={headOptions}
        onSubmitted={(item) => {
          setReviews((arr) => arr.map((x) => (x.id === item.id ? item : x)));
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
            <DialogTitle>Eliminar registro</DialogTitle>
            <DialogDescription>
              ¿Seguro que querés eliminar la revisión{' '}
              <span className="font-semibold text-foreground">
                {confirmDelete?.reviewId}
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
function ReviewFormDialog({
  open,
  onOpenChange,
  review,
  candidates,
  headOptions,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  review?: ReviewTime;
  candidates: Candidate[];
  headOptions: string[];
  onSubmitted: (item: ReviewTime) => void;
}) {
  const isEdit = !!review;
  const [loading, setLoading] = React.useState(false);

  const [candidateId, setCandidateId] = React.useState(review?.candidateId || '');
  const [headName, setHeadName] = React.useState(review?.headName || '');
  const [cvSentAt, setCvSentAt] = React.useState(review?.cvSentAt?.slice(0, 10) || '');
  const [returnedAt, setReturnedAt] = React.useState(
    review?.returnedAt?.slice(0, 10) || '',
  );

  React.useEffect(() => {
    if (!open) return;
    setCandidateId(review?.candidateId || '');
    setHeadName(review?.headName || '');
    setCvSentAt(review?.cvSentAt?.slice(0, 10) || '');
    setReturnedAt(review?.returnedAt?.slice(0, 10) || '');
  }, [open, review]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!candidateId) return toast.error('Seleccioná un candidato');
    if (!headName) return toast.error('Seleccioná un Hiring Manager');
    if (cvSentAt && returnedAt && returnedAt < cvSentAt) {
      return toast.error('El retorno no puede ser antes del envío');
    }

    setLoading(true);
    try {
      const url = isEdit ? `/api/review-times/${review!.id}` : '/api/review-times';
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          headName,
          cvSentAt: cvSentAt || null,
          returnedAt: returnedAt || null,
        }),
      });
      const json = await res.json().catch(() => ({ error: `Error ${res.status}` }));
      if (!res.ok) throw new Error((json as any).error || 'Error');
      onSubmitted((json as any).data);
      toast.success(isEdit ? 'Revisión actualizada' : 'Revisión creada');
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
          <DialogTitle>{isEdit ? 'Editar revisión' : 'Nueva revisión'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Modificá los datos de esta revisión de CV.'
              : 'Registra el tiempo de revisión de un CV por el Hiring Manager.'}
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
              <Label>Hiring Manager</Label>
              <Select value={headName} onValueChange={setHeadName}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar head" />
                </SelectTrigger>
                <SelectContent>
                  {headOptions.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fecha de envío del CV</Label>
              <Input
                type="date"
                value={cvSentAt}
                onChange={(e) => setCvSentAt(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Fecha de retorno del CV</Label>
              <Input
                type="date"
                value={returnedAt}
                onChange={(e) => setReturnedAt(e.target.value)}
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
