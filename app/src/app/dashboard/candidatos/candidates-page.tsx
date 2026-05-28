'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import {
  Briefcase,
  Download,
  Filter,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  DROP_REASONS,
  FINAL_STATUSES,
  FUENTES,
  STAGES,
  STAGE_COLORS,
  type Candidate,
  type CatalogItem,
  type FinalStatus,
  type Stage,
  type Vacancy,
} from '@/lib/types';
import { formatDate, initials, relativeTime } from '@/lib/utils';
import { exportToExcel, exportToPdf } from '@/lib/export';

interface Props {
  initialCandidates: Candidate[];
  vacancies: Vacancy[];
  recruiters: CatalogItem[];
}

const FINAL_BADGE: Record<FinalStatus, 'success' | 'destructive' | 'outline' | 'warning'> = {
  Contratado: 'success',
  'En proceso': 'outline',
  'Se cayó': 'destructive',
  'No seleccionado': 'warning',
};

// Extrae el numero del ID (ej "C0023" -> 23) para ordenamiento numerico real.
// IDs sin parte numerica van al final.
function numericId(id: string): number {
  const m = id?.match(/\d+/);
  return m ? parseInt(m[0], 10) : Number.MAX_SAFE_INTEGER;
}

export function CandidatesPage({ initialCandidates, vacancies, recruiters }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [candidates, setCandidates] = React.useState<Candidate[]>(initialCandidates);
  // Resincroniza el estado local cuando el server vuelve a renderizar con data nueva
  // (ej. despues de "Sincronizar con Airtable" en el topbar).
  React.useEffect(() => {
    setCandidates(initialCandidates);
  }, [initialCandidates]);
  const [search, setSearch] = React.useState(searchParams.get('q') || '');
  const [stage, setStage] = React.useState<string>('all');
  const [source, setSource] = React.useState<string>('all');
  const [vacancy, setVacancy] = React.useState<string>('all');
  const [recruiter, setRecruiter] = React.useState<string>('all');
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<Candidate | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<Candidate | null>(null);
  const [tab, setTab] = React.useState<'en-proceso' | 'finalizados'>('en-proceso');

  const vacanciesById = React.useMemo(
    () => new Map(vacancies.map((v) => [v.id, v])),
    [vacancies],
  );

  // Un candidato está "finalizado" si tiene un estado final cerrado.
  const isFinished = (c: Candidate) =>
    c.finalStatus === 'Contratado' ||
    c.finalStatus === 'Se cayó' ||
    c.finalStatus === 'No seleccionado';

  // Conteos por categoria (para los badges de los tabs). Respetan los demás
  // filtros (busqueda, etapa, etc.) pero NO el tab activo.
  const tabCounts = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    let enProceso = 0;
    let finalizados = 0;
    for (const c of candidates) {
      if (stage !== 'all' && c.stage !== stage) continue;
      if (source !== 'all' && c.source !== source) continue;
      if (vacancy !== 'all' && c.vacancyId !== vacancy) continue;
      if (recruiter !== 'all' && c.recruiter !== recruiter) continue;
      if (q) {
        const hay = `${c.name} ${c.id} ${c.recruiter || ''} ${c.vacancyId || ''}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      if (isFinished(c)) finalizados += 1;
      else enProceso += 1;
    }
    return { enProceso, finalizados };
  }, [candidates, search, stage, source, vacancy, recruiter]);

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    return candidates
      .filter((c) => {
        // Filtro por tab (estado del candidato)
        const finished = isFinished(c);
        if (tab === 'en-proceso' && finished) return false;
        if (tab === 'finalizados' && !finished) return false;
        if (stage !== 'all' && c.stage !== stage) return false;
        if (source !== 'all' && c.source !== source) return false;
        if (vacancy !== 'all' && c.vacancyId !== vacancy) return false;
        if (recruiter !== 'all' && c.recruiter !== recruiter) return false;
        if (q) {
          const hay = `${c.name} ${c.id} ${c.recruiter || ''} ${c.vacancyId || ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      // Orden ascendente por ID numerico real (C0001, C0002, ..., C0010)
      .sort((a, b) => numericId(a.id) - numericId(b.id));
  }, [candidates, search, stage, source, vacancy, recruiter, tab]);

  // Cambio de etapa con fecha: se abre un dialogo (calendario) antes de aplicar.
  const [stageChange, setStageChange] = React.useState<{
    candidate: Candidate;
    newStage: Stage;
  } | null>(null);
  const [stageDate, setStageDate] = React.useState(() =>
    new Date().toISOString().slice(0, 10),
  );

  function openStageChange(c: Candidate, newStage: string) {
    if (newStage === c.stage) return; // no cambió, no hacemos nada
    setStageChange({ candidate: c, newStage: newStage as Stage });
    setStageDate(new Date().toISOString().slice(0, 10));
  }

  async function updateStage(id: string, newStage: string, date: string) {
    const prev = candidates;
    setCandidates((arr) =>
      arr.map((c) => (c.id === id ? { ...c, stage: newStage as Stage } : c)),
    );
    try {
      const res = await fetch(`/api/candidates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage, stageDate: date }),
      });
      if (!res.ok) throw new Error('fail');
      toast.success('Etapa actualizada', { description: `${newStage} · ${date}` });
      router.refresh();
    } catch {
      setCandidates(prev);
      toast.error('No se pudo actualizar');
    }
  }

  async function confirmStageChange() {
    if (!stageChange || !stageDate) return;
    const { candidate, newStage } = stageChange;
    setStageChange(null);
    await updateStage(candidate.id, newStage, stageDate);
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setConfirmDelete(null);
    const prev = candidates;
    setCandidates((arr) => arr.filter((c) => c.id !== id));
    try {
      const res = await fetch(`/api/candidates/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Candidato eliminado');
      router.refresh();
    } catch {
      setCandidates(prev);
      toast.error('No se pudo eliminar');
    }
  }

  function clearFilters() {
    setSearch('');
    setStage('all');
    setSource('all');
    setVacancy('all');
    setRecruiter('all');
  }

  function exportXlsx() {
    exportToExcel(
      filtered.map((c) => ({
        ID: c.id,
        Nombre: c.name,
        Vacante: c.vacancyId || '',
        Puesto: vacanciesById.get(c.vacancyId || '')?.title || '',
        Etapa: c.stage,
        'Estado Final': c.finalStatus,
        Fuente: String(c.source),
        Reclutador: c.recruiter || '',
        Postulacion: formatDate(c.appliedAt),
        'Motivo Caida': c.dropReason || '',
      })),
      'candidatos-baldecash',
    );
    toast.success('Excel generado');
  }

  function exportPdf() {
    exportToPdf({
      title: 'Reporte de candidatos · Baldecash',
      columns: ['ID', 'Nombre', 'Puesto', 'Etapa', 'Estado', 'Fuente', 'Postulacion'],
      rows: filtered.map((c) => [
        c.id,
        c.name,
        vacanciesById.get(c.vacancyId || '')?.title || '-',
        c.stage,
        c.finalStatus,
        String(c.source),
        formatDate(c.appliedAt),
      ]),
    });
    toast.success('PDF generado');
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Candidatos</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} de {candidates.length} candidatos
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportXlsx}>
            <Download className="h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportPdf}>
            <Download className="h-4 w-4" />
            PDF
          </Button>
          <Button variant="gradient" size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            Nuevo candidato
          </Button>
        </div>
      </div>

      {/* Tabs: En proceso / Finalizados */}
      <div className="inline-flex rounded-xl border border-border bg-muted/40 p-1">
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
            {tabCounts.enProceso}
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
            {tabCounts.finalizados}
          </span>
        </button>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, ID, reclutador..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 lg:flex lg:items-center">
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Etapa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las etapas</SelectItem>
                {STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Fuente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las fuentes</SelectItem>
                {FUENTES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={vacancy} onValueChange={setVacancy}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Vacante" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las vacantes</SelectItem>
                {vacancies.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.id} · {v.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={recruiter} onValueChange={setRecruiter}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Reclutador" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los reclutadores</SelectItem>
                {recruiters.map((r) => (
                  <SelectItem key={r.id} value={r.name}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(search ||
              stage !== 'all' ||
              source !== 'all' ||
              vacancy !== 'all' ||
              recruiter !== 'all') && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4" />
                Limpiar
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Tabla */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Candidato</th>
                <th className="px-4 py-3 font-semibold">Vacante</th>
                <th className="px-4 py-3 font-semibold">Etapa</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Fuente</th>
                <th className="px-4 py-3 font-semibold">Reclutador</th>
                <th className="px-4 py-3 font-semibold">Postulación</th>
                <th className="px-4 py-3 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {filtered.map((c, i) => {
                  const vac = vacanciesById.get(c.vacancyId || '');
                  return (
                    <motion.tr
                      key={c.id}
                      layout
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: Math.min(i, 12) * 0.015 }}
                      className="border-b border-border/60 transition hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback>{initials(c.name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-semibold">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {vac ? (
                          <div>
                            <p className="font-medium">{vac.title}</p>
                            <p className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Briefcase className="h-3 w-3" />
                              {vac.area}
                            </p>
                          </div>
                        ) : c.vacancyId ? (
                          <div className="text-xs">
                            <span className="text-muted-foreground italic">Sin registrar</span>
                            <p className="text-[10px] text-muted-foreground">ref: {c.vacancyId}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Select value={c.stage} onValueChange={(v) => openStageChange(c, v)}>
                          <SelectTrigger className="h-8 w-[160px] text-xs">
                            <span
                              className="mr-1.5 h-2 w-2 rounded-full"
                              style={{ background: STAGE_COLORS[c.stage] }}
                            />
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
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={FINAL_BADGE[c.finalStatus]}>{c.finalStatus}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{String(c.source)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {c.recruiter || <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        <p>{formatDate(c.appliedAt)}</p>
                        <p className="text-[10px]">{relativeTime(c.appliedAt)}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditing(c)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4 text-brand-blue-500" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setConfirmDelete(c)}
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-sm text-muted-foreground"
                  >
                    <Filter className="mx-auto mb-2 h-6 w-6 opacity-40" />
                    No hay candidatos que coincidan con tu búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <NewCandidateDialog
        open={creating}
        onOpenChange={setCreating}
        vacancies={vacancies}
        recruiters={recruiters}
        onCreated={(c) => setCandidates((arr) => [c, ...arr])}
      />

      <EditCandidateDialog
        candidate={editing}
        onOpenChange={(v) => !v && setEditing(null)}
        vacancies={vacancies}
        recruiters={recruiters}
        onUpdated={(updated) =>
          setCandidates((arr) =>
            arr.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
          )
        }
      />

      <Dialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar candidato</DialogTitle>
            <DialogDescription>
              Esta accion no se puede deshacer. {confirmDelete?.name} sera removido de la base.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fecha de la etapa (calendario) al cambiar la etapa de un candidato */}
      <Dialog
        open={!!stageChange}
        onOpenChange={(v) => !v && setStageChange(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Fecha en la que se realizó {stageChange?.newStage}
            </DialogTitle>
            <DialogDescription>
              {stageChange?.candidate.name} ({stageChange?.candidate.id}) pasa de{' '}
              <span className="font-semibold text-foreground">
                {stageChange?.candidate.stage}
              </span>{' '}
              a{' '}
              <span className="font-semibold text-foreground">
                {stageChange?.newStage}
              </span>
              . Seleccioná la fecha en que ocurrió.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="stage-date">Fecha</Label>
            <Input
              id="stage-date"
              type="date"
              value={stageDate}
              onChange={(e) => setStageDate(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStageChange(null)}>
              Cancelar
            </Button>
            <Button
              variant="gradient"
              onClick={confirmStageChange}
              disabled={!stageDate}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NewCandidateDialog({
  open,
  onOpenChange,
  vacancies,
  recruiters,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  recruiters: CatalogItem[];
  vacancies: Vacancy[];
  onCreated: (c: Candidate) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries());
    try {
      const res = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          vacancyId: data.vacancyId === 'none' ? undefined : data.vacancyId,
          stage: data.stage || 'Screening',
          source: data.source || 'LinkedIn',
          recruiter: data.recruiter && data.recruiter !== 'none' ? data.recruiter : undefined,
          finalStatus: data.finalStatus || 'En proceso',
        }),
      });
      const json = await res.json().catch(() => ({ error: `Error ${res.status}` }));
      if (!res.ok) throw new Error(json.error || 'Error');
      onCreated(json.data);
      toast.success('Candidato creado');
      onOpenChange(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'No se pudo crear');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo candidato</DialogTitle>
          <DialogDescription>
            Se sincronizara con Airtable cuando esta configurado.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="name">Nombre completo</Label>
              <Input id="name" name="name" required minLength={2} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vacancyId">Vacante</Label>
              <Select name="vacancyId" defaultValue="none">
                <SelectTrigger>
                  <SelectValue placeholder="Sin vacante" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin vacante</SelectItem>
                  {vacancies
                    .filter((v) => v.status !== 'Cerrada')
                    .map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.id} · {v.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="source">Fuente</Label>
              <Select name="source" defaultValue="LinkedIn">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FUENTES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stage">Etapa</Label>
              <Select name="stage" defaultValue="Screening">
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
              <Label htmlFor="finalStatus">Estado final</Label>
              <Select name="finalStatus" defaultValue="En proceso">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FINAL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="recruiter">Reclutador asignado</Label>
              <Select name="recruiter" defaultValue="none">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {recruiters.map((r) => (
                    <SelectItem key={r.id} value={r.name}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="gradient" loading={loading}>
              <Plus className="h-4 w-4" />
              Crear candidato
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditCandidateDialog({
  candidate,
  onOpenChange,
  vacancies,
  recruiters,
  onUpdated,
}: {
  candidate: Candidate | null;
  onOpenChange: (v: boolean) => void;
  vacancies: Vacancy[];
  recruiters: CatalogItem[];
  onUpdated: (c: Candidate) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [form, setForm] = React.useState<Partial<Candidate> | null>(null);

  React.useEffect(() => {
    setForm(candidate ? { ...candidate } : null);
  }, [candidate]);

  if (!candidate || !form) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!candidate || !form) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/candidates/${candidate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          vacancyId: form.vacancyId || undefined,
          source: form.source,
          recruiter: form.recruiter || undefined,
          stage: form.stage,
          finalStatus: form.finalStatus,
          dropReason: form.dropReason || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');
      onUpdated(json.data);
      toast.success('Candidato actualizado');
      onOpenChange(false);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'No se pudo actualizar');
    } finally {
      setLoading(false);
    }
  }

  function set<K extends keyof Candidate>(key: K, value: Candidate[K] | undefined) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  return (
    <Dialog open={!!candidate} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar candidato</DialogTitle>
          <DialogDescription>
            {candidate.id} · cambios se sincronizan con Airtable.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label>Nombre completo</Label>
              <Input
                value={form.name || ''}
                onChange={(e) => set('name', e.target.value)}
                required
                minLength={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Vacante</Label>
              <Select
                value={form.vacancyId || 'none'}
                onValueChange={(v) => set('vacancyId', v === 'none' ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin vacante</SelectItem>
                  {vacancies
                    .filter(
                      (v) => v.status !== 'Cerrada' || v.id === form.vacancyId,
                    )
                    .map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.id} · {v.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Fuente</Label>
              <Select
                value={String(form.source || 'LinkedIn')}
                onValueChange={(v) => set('source', v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FUENTES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Etapa</Label>
              <Select
                value={form.stage || 'Screening'}
                onValueChange={(v) => set('stage', v as Stage)}
              >
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
              <Label>Estado final</Label>
              <Select
                value={form.finalStatus || 'En proceso'}
                onValueChange={(v) => set('finalStatus', v as FinalStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FINAL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label>Reclutador asignado</Label>
              <Select
                value={form.recruiter || 'none'}
                onValueChange={(v) => set('recruiter', v === 'none' ? undefined : v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {recruiters.map((r) => (
                    <SelectItem key={r.id} value={r.name}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.finalStatus === 'Se cayó' && (
              <div className="col-span-2 space-y-1.5">
                <Label>Motivo de caída</Label>
                <Select
                  value={form.dropReason || ''}
                  onValueChange={(v) => set('dropReason', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {DROP_REASONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="gradient" loading={loading}>
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
