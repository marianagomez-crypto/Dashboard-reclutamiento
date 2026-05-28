'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Megaphone, Pencil, Plus, Search, Trash2 } from 'lucide-react';
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
import type { Source, Vacancy } from '@/lib/types';

interface Props {
  initialSources: Source[];
  vacancies: Vacancy[];
  ownerOptions: string[];
}

// Catálogo conocido de canales (matchea con singleSelect en Airtable).
// Si el usuario tipea algo nuevo, typecast lo crea como opción.
const KNOWN_CHANNELS = [
  'Linkedin',
  'Bumeran',
  'Facebook',
  'Referidos',
  'Universidad de Lima',
  'Universidad del Pacífico',
];

// Color por canal (consistente con SourceChart del dashboard).
const CHANNEL_COLOR: Record<string, string> = {
  Linkedin: '#31359C',
  Bumeran: '#00A29B',
  Facebook: '#6873D7',
  Referidos: '#36B7B3',
  'Universidad de Lima': '#FDCA56',
  'Universidad del Pacífico': '#98A9DF',
};

function colorFor(name: string): string {
  return CHANNEL_COLOR[name] || '#6873D7';
}

function formatMoney(n?: number | null): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    maximumFractionDigits: 0,
  }).format(n);
}

function numericSourceId(id?: string): number {
  const m = id?.match(/\d+/);
  return m ? parseInt(m[0], 10) : Number.MAX_SAFE_INTEGER;
}

export function SourcesPage({ initialSources, vacancies, ownerOptions }: Props) {
  const router = useRouter();
  const [sources, setSources] = React.useState(initialSources);
  React.useEffect(() => {
    setSources(initialSources);
  }, [initialSources]);

  const [search, setSearch] = React.useState('');
  const [channelFilter, setChannelFilter] = React.useState<string>('all');
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<Source | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<Source | null>(null);

  const vacanciesById = React.useMemo(
    () => new Map(vacancies.map((v) => [v.id, v])),
    [vacancies],
  );

  // Canales presentes en la data + KNOWN_CHANNELS (dedup) → para el dropdown
  const channelOptions = React.useMemo(() => {
    const set = new Set<string>(KNOWN_CHANNELS);
    sources.forEach((s) => s.name && set.add(s.name));
    return Array.from(set).sort();
  }, [sources]);

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    const list = sources.filter((s) => {
      if (channelFilter !== 'all' && s.name !== channelFilter) return false;
      if (!q) return true;
      const v = vacanciesById.get(s.vacancyId || '');
      const hay = `${s.sourceId || ''} ${s.vacancyId || ''} ${s.name} ${
        v?.title || ''
      } ${s.owner || ''}`.toLowerCase();
      return hay.includes(q);
    });
    return [...list].sort(
      (a, b) => numericSourceId(a.sourceId) - numericSourceId(b.sourceId),
    );
  }, [sources, search, channelFilter, vacanciesById]);

  async function handleDelete() {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setConfirmDelete(null);
    const prev = sources;
    setSources((arr) => arr.filter((s) => s.id !== id));
    try {
      const res = await fetch(`/api/sources/${id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as any).error || 'Error');
      toast.success('Fuente eliminada');
      router.refresh();
    } catch (err: any) {
      setSources(prev);
      toast.error(err.message || 'No se pudo eliminar');
    }
  }

  // Stats: total, costo mensual total, canal más usado
  const totalCost = sources.reduce((acc, s) => acc + (s.monthlyCost || 0), 0);
  const channelCounts: Record<string, number> = {};
  sources.forEach((s) => {
    if (s.name) channelCounts[s.name] = (channelCounts[s.name] || 0) + 1;
  });
  const topChannel = Object.entries(channelCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Fuentes</h1>
          <p className="text-sm text-muted-foreground">
            Canales de adquisición por vacante · costo y responsable
          </p>
        </div>

        {/* Stats */}
        {sources.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-4 shadow-card">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Fuentes registradas
              </p>
              <p className="mt-0.5 font-display text-2xl font-bold tabular-nums">
                {sources.length}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-card">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Costo mensual total
              </p>
              <p className="mt-0.5 font-display text-2xl font-bold tabular-nums">
                {formatMoney(totalCost)}
              </p>
            </div>
            {topChannel && (
              <div className="col-span-2 rounded-xl border border-border bg-card p-4 shadow-card sm:col-span-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Canal más usado
                </p>
                <p
                  className="mt-0.5 font-display text-2xl font-bold"
                  style={{ color: colorFor(topChannel[0]) }}
                >
                  {topChannel[0]}
                </p>
                <p className="text-[10px] text-muted-foreground tabular-nums">
                  {topChannel[1]} {topChannel[1] === 1 ? 'vacante' : 'vacantes'}
                </p>
              </div>
            )}
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <div className="shrink-0 rounded-xl bg-brand-blue-100 p-2 text-brand-blue-700 dark:bg-brand-blue-600/20 dark:text-brand-blue-100">
                  <Megaphone className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <CardTitle>Canales de adquisición</CardTitle>
                  <CardDescription>
                    Editá los canales, su costo mensual y responsable
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
                <Select value={channelFilter} onValueChange={setChannelFilter}>
                  <SelectTrigger className="w-[140px] shrink-0">
                    <SelectValue placeholder="Canal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los canales</SelectItem>
                    {channelOptions.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="gradient"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setCreating(true)}
                >
                  <Plus className="h-4 w-4" />
                  Nueva
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {filtered.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center rounded-xl bg-muted/40 p-6 text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  No hay fuentes para mostrar
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Agregá una con el botón "Nueva" o ajustá los filtros.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[640px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-muted/40 text-left">
                      <th className="w-24 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        ID
                      </th>
                      <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Vacante
                      </th>
                      <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Canal
                      </th>
                      <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Costo mensual
                      </th>
                      <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Responsable
                      </th>
                      <th className="w-[88px] px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s, i) => {
                      const v = vacanciesById.get(s.vacancyId || '');
                      const color = colorFor(s.name);
                      return (
                        <motion.tr
                          key={s.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(i * 0.02, 0.25) }}
                          className="border-t border-border transition-colors hover:bg-muted/30"
                        >
                          <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-muted-foreground">
                            {s.sourceId || '—'}
                          </td>
                          <td className="px-3 py-2.5">
                            <p className="font-medium text-foreground">
                              {v?.title || '—'}
                            </p>
                            <p className="text-[11px] font-mono text-muted-foreground">
                              {s.vacancyId}
                            </p>
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                              style={{
                                background: `${color}1A`,
                                color,
                              }}
                            >
                              <span
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ background: color }}
                              />
                              {s.name}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">
                            {formatMoney(s.monthlyCost)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2.5 text-xs text-muted-foreground">
                            {s.owner || '—'}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => setEditing(s)}
                                aria-label="Editar"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => setConfirmDelete(s)}
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
      <SourceFormDialog
        open={creating}
        onOpenChange={setCreating}
        vacancies={vacancies}
        channelOptions={channelOptions}
        ownerOptions={ownerOptions}
        onSubmitted={(item) => {
          setSources((arr) => [item, ...arr]);
          router.refresh();
        }}
      />

      {/* Editar */}
      <SourceFormDialog
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        source={editing || undefined}
        vacancies={vacancies}
        channelOptions={channelOptions}
        ownerOptions={ownerOptions}
        onSubmitted={(item) => {
          setSources((arr) => arr.map((x) => (x.id === item.id ? item : x)));
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
            <DialogTitle>Eliminar fuente</DialogTitle>
            <DialogDescription>
              ¿Seguro que querés eliminar la fuente{' '}
              <span className="font-semibold text-foreground">
                {confirmDelete?.name}
              </span>{' '}
              ({confirmDelete?.sourceId})? Esta acción no se puede deshacer.
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
function SourceFormDialog({
  open,
  onOpenChange,
  source,
  vacancies,
  channelOptions,
  ownerOptions,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  source?: Source;
  vacancies: Vacancy[];
  channelOptions: string[];
  ownerOptions: string[];
  onSubmitted: (item: Source) => void;
}) {
  const isEdit = !!source;
  const [loading, setLoading] = React.useState(false);

  const [vacancyId, setVacancyId] = React.useState(source?.vacancyId || '');
  const [name, setName] = React.useState(source?.name || '');
  const [cost, setCost] = React.useState<string>(
    source?.monthlyCost !== undefined ? String(source.monthlyCost) : '',
  );
  const [owner, setOwner] = React.useState(source?.owner || '');

  React.useEffect(() => {
    if (!open) return;
    setVacancyId(source?.vacancyId || '');
    setName(source?.name || '');
    setCost(source?.monthlyCost !== undefined ? String(source.monthlyCost) : '');
    setOwner(source?.owner || '');
  }, [open, source]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vacancyId) return toast.error('Seleccioná una vacante');
    if (!name) return toast.error('Seleccioná un canal');

    const costN = cost === '' ? undefined : Number(cost);
    if (costN !== undefined && !Number.isFinite(costN)) {
      return toast.error('Costo inválido');
    }

    setLoading(true);
    try {
      const url = isEdit ? `/api/sources/${source!.id}` : '/api/sources';
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vacancyId,
          name,
          monthlyCost: costN,
          owner: owner || null,
        }),
      });
      const json = await res.json().catch(() => ({ error: `Error ${res.status}` }));
      if (!res.ok) throw new Error((json as any).error || 'Error');
      onSubmitted((json as any).data);
      toast.success(isEdit ? 'Fuente actualizada' : 'Fuente creada');
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
          <DialogTitle>{isEdit ? 'Editar fuente' : 'Nueva fuente'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Modificá los datos de este canal de adquisición.'
              : 'Asigná un canal de adquisición a una vacante.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Canal</Label>
              <Select value={name} onValueChange={setName}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar canal" />
                </SelectTrigger>
                <SelectContent>
                  {channelOptions.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Costo mensual (S/)</Label>
              <Input
                type="number"
                min={0}
                step="50"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Responsable</Label>
            <Select
              value={owner || 'none'}
              onValueChange={(v) => setOwner(v === 'none' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {ownerOptions.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Combina reclutadores y hiring managers del catálogo.
            </p>
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
