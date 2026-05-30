'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Briefcase,
  Building2,
  Eye,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AREAS,
  MODALIDADES,
  PRIORITIES,
  STAGE_COLORS,
  STAGES,
  VACANCY_STATUSES,
  type Candidate,
  type CatalogItem,
  type Vacancy,
} from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { VacancyAgingChart, type VacancyAgingRow } from '@/components/dashboard/charts';
import { useCanMutate, useIsAdmin } from '@/components/auth/role-context';

interface Props {
  initialVacancies: Vacancy[];
  candidates: Candidate[];
  seniorities: CatalogItem[];
  hiringManagers: CatalogItem[];
  recruiters: CatalogItem[];
}

const statusVariant: Record<Vacancy['status'], 'success' | 'warning' | 'outline'> = {
  Abierta: 'success',
  'En Pausa': 'warning',
  Cerrada: 'outline',
};

const priorityVariant: Record<Vacancy['priority'], 'destructive' | 'gold' | 'blue'> = {
  Alta: 'destructive',
  Media: 'gold',
  Baja: 'blue',
};

export function VacanciesPage({
  initialVacancies,
  candidates,
  seniorities,
  hiringManagers,
  recruiters,
}: Props) {
  const router = useRouter();
  const canMutate = useCanMutate();
  const isAdmin = useIsAdmin();
  const [vacancies, setVacancies] = React.useState(initialVacancies);
  // Resincroniza el estado local cuando el server vuelve a renderizar con data nueva
  // (ej. despues de "Sincronizar con Airtable" en el topbar).
  React.useEffect(() => {
    setVacancies(initialVacancies);
  }, [initialVacancies]);
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<Vacancy | null>(null);
  const [viewing, setViewing] = React.useState<Vacancy | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<Vacancy | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [areaFilter, setAreaFilter] = React.useState<string>('all');

  const candidatesByVacancy = React.useMemo(() => {
    const map = new Map<string, Candidate[]>();
    for (const c of candidates) {
      if (!c.vacancyId) continue;
      if (!map.has(c.vacancyId)) map.set(c.vacancyId, []);
      map.get(c.vacancyId)!.push(c);
    }
    return map;
  }, [candidates]);

  const countFor = (v: Vacancy) => candidatesByVacancy.get(v.id)?.length || 0;
  const hiredFor = (v: Vacancy) =>
    (candidatesByVacancy.get(v.id) || []).filter((c) => c.finalStatus === 'Contratado')
      .length;

  const filtered = React.useMemo(
    () =>
      vacancies.filter(
        (v) =>
          (statusFilter === 'all' || v.status === statusFilter) &&
          (areaFilter === 'all' || v.area === areaFilter),
      ),
    [vacancies, statusFilter, areaFilter],
  );

  // Aging: vacantes ABIERTAS con días transcurridos desde la apertura.
  // Si el area filter esta activo, lo respeta para mantener coherencia visual.
  const agingRows: VacancyAgingRow[] = React.useMemo(() => {
    const now = Date.now();
    return vacancies
      .filter((v) => v.status === 'Abierta')
      .filter((v) => areaFilter === 'all' || v.area === areaFilter)
      .filter((v) => !!v.openedAt)
      .map((v) => {
        const opened = new Date(v.openedAt).getTime();
        const days = Math.max(0, Math.floor((now - opened) / 86_400_000));
        return {
          id: v.id,
          title: v.title,
          daysOpen: days,
          priority: v.priority,
        };
      });
  }, [vacancies, areaFilter]);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries());
    try {
      const res = await fetch('/api/vacancies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          area: data.area,
          seniority: data.seniority || undefined,
          recruiter: data.recruiter && data.recruiter !== 'none' ? data.recruiter : undefined,
          hiringManager:
            data.hiringManager && data.hiringManager !== 'none' ? data.hiringManager : undefined,
          positions: Number(data.positions),
          status: data.status,
          priority: data.priority,
          modalidad: data.modalidad && data.modalidad !== 'none' ? data.modalidad : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setVacancies((arr) => [json.data, ...arr]);
      setCreating(false);
      toast.success('Vacante creada');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Error');
    }
  }

  async function onDelete() {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setConfirmDelete(null);
    const prev = vacancies;
    setVacancies((arr) => arr.filter((v) => v.id !== id));
    try {
      const res = await fetch(`/api/vacancies/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Vacante eliminada');
      router.refresh();
    } catch {
      setVacancies(prev);
      toast.error('No se pudo eliminar');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Vacantes</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} de {vacancies.length} —{' '}
            {vacancies.filter((v) => v.status === 'Abierta').length} abiertas
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {VACANCY_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={areaFilter} onValueChange={setAreaFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Área" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las áreas</SelectItem>
              {AREAS.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canMutate && (
            <Button variant="gradient" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" />
              Nueva vacante
            </Button>
          )}
        </div>
      </div>

      <VacancyAgingChart data={agingRows} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((v, i) => (
          <motion.div
            key={v.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i, 8) * 0.04 }}
          >
            <Card className="group h-full overflow-hidden transition-all hover:-translate-y-1 hover:shadow-glow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {v.id}
                    </p>
                    <CardTitle className="text-base">{v.title}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant={statusVariant[v.status]}>{v.status}</Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => setViewing(v)}>
                          <Eye className="h-4 w-4" />
                          Ver detalles
                        </DropdownMenuItem>
                        {canMutate && (
                          <DropdownMenuItem onClick={() => setEditing(v)}>
                            <Pencil className="h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                        )}
                        {isAdmin && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setConfirmDelete(v)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  {v.area}
                  {v.seniority ? ` · ${v.seniority}` : ''}
                </p>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <Badge variant={priorityVariant[v.priority]}>Prioridad {v.priority}</Badge>
                  {v.modalidad && <Badge variant="outline">{v.modalidad}</Badge>}
                  {v.reopens && v.reopens > 0 ? (
                    <Badge variant="gold">{v.reopens}× reabierta</Badge>
                  ) : null}
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {v.recruiter && (
                    <p>
                      <span className="font-semibold text-foreground">Reclutador:</span>{' '}
                      {v.recruiter}
                    </p>
                  )}
                  {v.hiringManager && (
                    <p>
                      <span className="font-semibold text-foreground">Hiring Manager:</span>{' '}
                      {v.hiringManager}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Briefcase className="h-3.5 w-3.5" />
                    {v.positions} {v.positions === 1 ? 'plaza' : 'plazas'}
                  </span>
                  <button
                    onClick={() => setViewing(v)}
                    className="inline-flex items-center gap-1.5 font-semibold text-primary transition hover:underline"
                  >
                    <Users className="h-3.5 w-3.5" />
                    {countFor(v)} cand · {hiredFor(v)} contratados
                  </button>
                </div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Abierta {formatDate(v.openedAt)}
                  {v.closedAt ? ` · Cerrada ${formatDate(v.closedAt)}` : ''}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* CREATE */}
      <VacancyFormDialog
        open={creating}
        onOpenChange={setCreating}
        onSubmit={onCreate}
        title="Nueva vacante"
        submitLabel="Crear"
        seniorities={seniorities}
        hiringManagers={hiringManagers}
        recruiters={recruiters}
      />

      {/* EDIT */}
      <EditVacancyDialog
        vacancy={editing}
        onOpenChange={(o) => !o && setEditing(null)}
        onUpdated={(v) =>
          setVacancies((arr) => arr.map((x) => (x.id === v.id ? { ...x, ...v } : x)))
        }
        seniorities={seniorities}
        hiringManagers={hiringManagers}
        recruiters={recruiters}
      />

      {/* VIEW */}
      <VacancyDetailsDialog
        vacancy={viewing}
        candidates={viewing ? candidatesByVacancy.get(viewing.id) || [] : []}
        onOpenChange={(o) => !o && setViewing(null)}
        onEdit={() => {
          setEditing(viewing);
          setViewing(null);
        }}
      />

      {/* DELETE */}
      <Dialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar vacante</DialogTitle>
            <DialogDescription>
              {confirmDelete?.title} ({confirmDelete?.id}) será removida. Esto no afecta los
              candidatos asociados, pero la columna “Vacante” quedará marcada como “Sin registrar”.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={onDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VacancyFormDialog({
  open,
  onOpenChange,
  onSubmit,
  title,
  submitLabel,
  initial,
  seniorities,
  hiringManagers,
  recruiters,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  title: string;
  submitLabel: string;
  initial?: Vacancy | null;
  seniorities: CatalogItem[];
  hiringManagers: CatalogItem[];
  recruiters: CatalogItem[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="title">Puesto</Label>
            <Input id="title" name="title" defaultValue={initial?.title} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="area">Área</Label>
              <Select name="area" defaultValue={initial?.area || AREAS[0]}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AREAS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="seniority">Seniority</Label>
              <Select name="seniority" defaultValue={initial?.seniority || 'none'}>
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {seniorities.map((s) => (
                    <SelectItem key={s.id} value={s.name}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="positions">Plazas</Label>
              <Input
                id="positions"
                name="positions"
                type="number"
                min={1}
                defaultValue={initial?.positions ?? 1}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="recruiter">Reclutador</Label>
              <Select name="recruiter" defaultValue={initial?.recruiter || 'none'}>
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
            <div className="space-y-1.5">
              <Label htmlFor="hiringManager">Hiring Manager</Label>
              <Select name="hiringManager" defaultValue={initial?.hiringManager || 'none'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {hiringManagers.map((m) => (
                    <SelectItem key={m.id} value={m.name}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="modalidad">Modalidad</Label>
              <Select name="modalidad" defaultValue={initial?.modalidad || 'none'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {MODALIDADES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="status">Estado</Label>
              <Select name="status" defaultValue={initial?.status || 'Abierta'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VACANCY_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="priority">Prioridad</Label>
              <Select name="priority" defaultValue={initial?.priority || 'Media'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
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
            <Button type="submit" variant="gradient">
              <Plus className="h-4 w-4" />
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditVacancyDialog({
  vacancy,
  onOpenChange,
  onUpdated,
  seniorities,
  hiringManagers,
  recruiters,
}: {
  vacancy: Vacancy | null;
  onOpenChange: (o: boolean) => void;
  onUpdated: (v: Vacancy) => void;
  seniorities: CatalogItem[];
  hiringManagers: CatalogItem[];
  recruiters: CatalogItem[];
}) {
  const router = useRouter();
  if (!vacancy) return null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!vacancy) return;
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries());
    try {
      const res = await fetch(`/api/vacancies/${vacancy.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: data.title,
          area: data.area,
          seniority: data.seniority || undefined,
          recruiter: data.recruiter && data.recruiter !== 'none' ? data.recruiter : undefined,
          hiringManager:
            data.hiringManager && data.hiringManager !== 'none' ? data.hiringManager : undefined,
          positions: Number(data.positions),
          status: data.status,
          priority: data.priority,
          modalidad: data.modalidad && data.modalidad !== 'none' ? data.modalidad : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      onUpdated(json.data);
      onOpenChange(false);
      toast.success('Vacante actualizada');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Error');
    }
  }

  return (
    <VacancyFormDialog
      open={!!vacancy}
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
      title={`Editar ${vacancy.id}`}
      submitLabel="Guardar"
      initial={vacancy}
      seniorities={seniorities}
      hiringManagers={hiringManagers}
      recruiters={recruiters}
    />
  );
}

function VacancyDetailsDialog({
  vacancy,
  candidates,
  onOpenChange,
  onEdit,
}: {
  vacancy: Vacancy | null;
  candidates: Candidate[];
  onOpenChange: (o: boolean) => void;
  onEdit: () => void;
}) {
  if (!vacancy) return null;

  const stageCounts = STAGES.map((s) => ({
    stage: s,
    count: candidates.filter((c) => c.stage === s).length,
  }));

  return (
    <Dialog open={!!vacancy} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {vacancy.id}
              </p>
              <DialogTitle className="font-display text-2xl">{vacancy.title}</DialogTitle>
              <DialogDescription className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                {vacancy.area}
                {vacancy.seniority ? ` · ${vacancy.seniority}` : ''}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant={statusVariant[vacancy.status]}>{vacancy.status}</Badge>
              <Badge variant={priorityVariant[vacancy.priority]}>
                Prioridad {vacancy.priority}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <DetailField label="Plazas" value={String(vacancy.positions)} />
          <DetailField label="Modalidad" value={vacancy.modalidad || '—'} />
          <DetailField label="Reclutador" value={vacancy.recruiter || '—'} />
          <DetailField label="Hiring Manager" value={vacancy.hiringManager || '—'} />
          <DetailField label="Fecha apertura" value={formatDate(vacancy.openedAt)} />
          <DetailField
            label="Fecha cierre"
            value={vacancy.closedAt ? formatDate(vacancy.closedAt) : '—'}
          />
          <DetailField label="Veces reabierta" value={String(vacancy.reopens ?? 0)} />
          {vacancy.reopenReason && (
            <DetailField label="Motivo reapertura" value={vacancy.reopenReason} />
          )}
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pipeline · {candidates.length} candidatos
          </p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {stageCounts.map((s) => (
              <div
                key={s.stage}
                className="rounded-lg border border-border bg-card p-2 text-center"
              >
                <p
                  className="font-display text-xl font-bold"
                  style={{ color: STAGE_COLORS[s.stage] }}
                >
                  {s.count}
                </p>
                <p className="line-clamp-1 text-[10px] uppercase text-muted-foreground">
                  {s.stage}
                </p>
              </div>
            ))}
          </div>
        </div>

        {candidates.length > 0 && (
          <div className="max-h-48 overflow-y-auto rounded-xl border border-border scrollbar-thin">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted/60 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left">Candidato</th>
                  <th className="px-3 py-2 text-left">Etapa</th>
                  <th className="px-3 py-2 text-left">Estado</th>
                </tr>
              </thead>
              <tbody>
                {candidates.slice(0, 50).map((c) => (
                  <tr key={c.id} className="border-t border-border/60">
                    <td className="px-3 py-1.5 font-medium">{c.name}</td>
                    <td className="px-3 py-1.5">{c.stage}</td>
                    <td className="px-3 py-1.5">{c.finalStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button variant="gradient" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            Editar vacante
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card/50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
