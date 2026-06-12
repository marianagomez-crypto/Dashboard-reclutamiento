'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { HeartPulse, Pencil, Plus, Search, Trash2 } from 'lucide-react';
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
  EXAM_SEDES,
  EXAM_STATUSES,
  EXAM_RESULTS,
  EXAM_STATUS_COLORS,
  EXAM_RESULT_COLORS,
  EXAM_PRICE_OVER_39,
  EXAM_PRICE_UNDER_39,
  type MedicalExam,
} from '@/lib/types';
import { useCanMutate, useIsAdmin } from '@/components/auth/role-context';

interface Colaborador {
  id: string;
  name: string;
  area: string;
  birthDate: string;
}
interface Props {
  initialExams: MedicalExam[];
  colaboradores: Colaborador[];
  aboveTable?: React.ReactNode;
}

// ---- Helpers de cálculo ----
function formatDate(iso?: string): string {
  if (!iso) return '—';
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}
function addDays(iso: string | undefined, days: number): string {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return '';
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
function ageFrom(birthIso: string): number | null {
  if (!birthIso) return null;
  const b = new Date(`${birthIso}T00:00:00Z`);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let a = now.getUTCFullYear() - b.getUTCFullYear();
  const md = now.getUTCMonth() - b.getUTCMonth();
  if (md < 0 || (md === 0 && now.getUTCDate() < b.getUTCDate())) a--;
  return a;
}
// "Mayor de 39 años" = 40 años o más. Sin fecha de nacimiento → no se calcula.
function mayorDe39(birthIso: string): '' | 'Si' | 'No' {
  const a = ageFrom(birthIso);
  if (a === null) return '';
  return a >= 40 ? 'Si' : 'No';
}
function precioFor(m39: '' | 'Si' | 'No'): number | null {
  if (m39 === 'Si') return EXAM_PRICE_OVER_39;
  if (m39 === 'No') return EXAM_PRICE_UNDER_39;
  return null;
}
function formatMoney(n: number | null): string {
  if (n === null) return '—';
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    minimumFractionDigits: 2,
  }).format(n);
}

export function ExamenesPage({ initialExams, colaboradores, aboveTable }: Props) {
  const router = useRouter();
  const canMutate = useCanMutate();
  const isAdmin = useIsAdmin();

  const [exams, setExams] = React.useState(initialExams);
  React.useEffect(() => setExams(initialExams), [initialExams]);

  const [search, setSearch] = React.useState('');
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<MedicalExam | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<MedicalExam | null>(null);

  const colById = React.useMemo(
    () => new Map(colaboradores.map((c) => [c.id, c])),
    [colaboradores],
  );

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return exams;
    return exams.filter((e) => {
      const c = colById.get(e.collaboratorId);
      return `${e.collaboratorName} ${c?.area || ''} ${e.sede || ''} ${e.status || ''}`
        .toLowerCase()
        .includes(q);
    });
  }, [exams, search, colById]);

  async function handleDelete() {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setConfirmDelete(null);
    const prev = exams;
    setExams((arr) => arr.filter((e) => e.id !== id));
    try {
      const res = await fetch(`/api/bienestar/examenes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error');
      toast.success('Examen eliminado');
      router.refresh();
    } catch {
      setExams(prev);
      toast.error('No se pudo eliminar');
    }
  }

  const programados = exams.filter((e) => e.status === 'Programado').length;
  const reprogramados = exams.filter((e) => e.status === 'Reprogramado').length;
  const conObs = exams.filter((e) => e.resultado === 'Con observaciones').length;

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Exámenes médicos</h1>
          <p className="text-sm text-muted-foreground">
            Seguimiento de exámenes ocupacionales · sede, vencimientos y resultados
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Exámenes" value={String(exams.length)} />
          <StatCard label="Programados" value={String(programados)} color={EXAM_STATUS_COLORS.Programado} />
          <StatCard label="Reprogramados" value={String(reprogramados)} color={EXAM_STATUS_COLORS.Reprogramado} />
          <StatCard label="Con observaciones" value={String(conObs)} color={EXAM_RESULT_COLORS['Con observaciones']} />
        </div>

        {aboveTable}

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <div className="shrink-0 rounded-xl bg-brand-blue-100 p-2 text-brand-blue-700 dark:bg-brand-blue-600/20 dark:text-brand-blue-100">
                  <HeartPulse className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <CardTitle>Exámenes médicos</CardTitle>
                  <CardDescription>
                    Próximo examen, vencimientos, edad y precio se calculan solos
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
                {canMutate && (
                  <Button variant="gradient" size="sm" className="shrink-0" onClick={() => setCreating(true)}>
                    <Plus className="h-4 w-4" />
                    Examen
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {filtered.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center rounded-xl bg-muted/40 p-6 text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  Aún no hay exámenes registrados
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Agregá uno con el botón "Examen": elegís área, luego colaborador.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[1100px] border-collapse text-sm">
                  <thead>
                    <tr className="bg-muted/40 text-left">
                      <Th>Nombres Completos</Th>
                      <Th>Área</Th>
                      <Th>Fecha examen</Th>
                      <Th>Próximo examen</Th>
                      <Th>Máx. subsanar</Th>
                      <Th>Sede</Th>
                      <Th>Status</Th>
                      <Th>Resultado</Th>
                      <Th className="text-center">Mayor 39</Th>
                      <Th className="text-right">Precio</Th>
                      <Th className="text-right">Acciones</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((e, i) => {
                      const c = colById.get(e.collaboratorId);
                      const m39 = mayorDe39(c?.birthDate || '');
                      const precio = precioFor(m39);
                      const next = addDays(e.examDate, 730);
                      const fix = addDays(e.examDate, 30);
                      return (
                        <motion.tr
                          key={e.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(i * 0.015, 0.2) }}
                          className="border-t border-border transition-colors hover:bg-muted/30"
                        >
                          <Td className="whitespace-nowrap font-medium text-foreground">
                            {e.collaboratorName}
                          </Td>
                          <Td className="whitespace-nowrap text-muted-foreground">{c?.area || '—'}</Td>
                          <Td className="whitespace-nowrap text-muted-foreground">{formatDate(e.examDate)}</Td>
                          <Td className="whitespace-nowrap text-muted-foreground">{formatDate(next)}</Td>
                          <Td className="whitespace-nowrap text-muted-foreground">{formatDate(fix)}</Td>
                          <Td className="whitespace-nowrap">{e.sede || '—'}</Td>
                          <Td>
                            <Badge value={e.status} colors={EXAM_STATUS_COLORS} />
                          </Td>
                          <Td>
                            <Badge value={e.resultado} colors={EXAM_RESULT_COLORS} />
                          </Td>
                          <Td className="text-center">
                            {m39 === '' ? (
                              <span className="text-xs text-muted-foreground">—</span>
                            ) : (
                              <span
                                className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                                style={{
                                  background: m39 === 'Si' ? '#CA8A041A' : '#94A3B81A',
                                  color: m39 === 'Si' ? '#CA8A04' : '#64748B',
                                }}
                              >
                                {m39}
                              </span>
                            )}
                          </Td>
                          <Td className="whitespace-nowrap text-right tabular-nums">{formatMoney(precio)}</Td>
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
                              {isAdmin && (
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
                              {!canMutate && !isAdmin && (
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

      <ExamFormDialog
        open={creating}
        onOpenChange={setCreating}
        colaboradores={colaboradores}
        onSubmitted={(item) => {
          setExams((arr) => [...arr, item]);
          router.refresh();
        }}
      />
      <ExamFormDialog
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        exam={editing || undefined}
        colaboradores={colaboradores}
        onSubmitted={(item) => {
          setExams((arr) => arr.map((x) => (x.id === item.id ? item : x)));
          setEditing(null);
          router.refresh();
        }}
      />

      <Dialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar examen</DialogTitle>
            <DialogDescription>
              ¿Seguro que querés eliminar el examen de{' '}
              <span className="font-semibold text-foreground">{confirmDelete?.collaboratorName}</span>?
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

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={`px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground ${className}`}>
      {children}
    </th>
  );
}
function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 align-middle ${className}`}>{children}</td>;
}
function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-display text-2xl font-bold tabular-nums" style={color ? { color } : undefined}>
        {value}
      </p>
    </div>
  );
}
function Badge({ value, colors }: { value?: string; colors: Record<string, string> }) {
  if (!value) return <span className="text-xs text-muted-foreground">—</span>;
  const color = colors[value] || '#6873D7';
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ background: `${color}1A`, color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {value}
    </span>
  );
}

// ============================================================================
// Modal: Área → Colaborador → datos del examen
// ============================================================================
function ExamFormDialog({
  open,
  onOpenChange,
  exam,
  colaboradores,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  exam?: MedicalExam;
  colaboradores: Colaborador[];
  onSubmitted: (item: MedicalExam) => void;
}) {
  const isEdit = !!exam;
  const [loading, setLoading] = React.useState(false);

  const existing = exam ? colaboradores.find((c) => c.id === exam.collaboratorId) : undefined;
  const [area, setArea] = React.useState('');
  const [colId, setColId] = React.useState('');
  const [examDate, setExamDate] = React.useState('');
  const [sede, setSede] = React.useState<string>('Sin asignar');
  const [status, setStatus] = React.useState<string>('Sin asignar');
  const [resultado, setResultado] = React.useState<string>('');

  React.useEffect(() => {
    if (!open) return;
    setArea(existing?.area || '');
    setColId(exam?.collaboratorId || '');
    setExamDate(exam?.examDate || '');
    setSede(exam?.sede || 'Sin asignar');
    setStatus(exam?.status || 'Sin asignar');
    setResultado(exam?.resultado || '');
  }, [open, exam, existing]);

  // Áreas disponibles (de los colaboradores) + colaboradores filtrados por área.
  const areas = React.useMemo(
    () => Array.from(new Set(colaboradores.map((c) => c.area).filter(Boolean))).sort(),
    [colaboradores],
  );
  const colsInArea = React.useMemo(
    () => colaboradores.filter((c) => c.area === area).sort((a, b) => a.name.localeCompare(b.name)),
    [colaboradores, area],
  );
  const selectedCol = colaboradores.find((c) => c.id === colId);

  // Preview de campos calculados.
  const m39 = mayorDe39(selectedCol?.birthDate || '');
  const precio = precioFor(m39);
  const next = addDays(examDate, 730);
  const fix = addDays(examDate, 30);

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const collaboratorName = selectedCol?.name || exam?.collaboratorName || '';
    if (!colId || !collaboratorName) return toast.error('Elegí un colaborador');
    setLoading(true);
    try {
      const url = isEdit ? `/api/bienestar/examenes/${exam!.id}` : '/api/bienestar/examenes';
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collaboratorId: colId,
          collaboratorName,
          examDate: examDate || null,
          sede: sede || null,
          status: status || null,
          resultado: resultado || null,
        }),
      });
      const json = await res.json().catch(() => ({ error: `Error ${res.status}` }));
      if (!res.ok) throw new Error((json as any).error || 'Error');
      onSubmitted((json as any).data);
      toast.success(isEdit ? 'Examen actualizado' : 'Examen registrado');
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'No se pudo guardar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar examen' : 'Nuevo examen médico'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Modificá los datos del examen.' : 'Elegí el área y luego el colaborador.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {isEdit ? (
            // Al editar, Área y Colaborador quedan fijos (consistencia).
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Área</Label>
                <div className="flex h-10 items-center truncate rounded-lg border border-border bg-muted/40 px-3 text-sm text-muted-foreground">
                  {existing?.area || '—'}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Colaborador</Label>
                <div className="flex h-10 items-center truncate rounded-lg border border-border bg-muted/40 px-3 text-sm font-medium text-foreground">
                  {exam?.collaboratorName}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Área</Label>
                <Select
                  value={area || 'none'}
                  onValueChange={(v) => {
                    setArea(v === 'none' ? '' : v);
                    setColId(''); // resetea colaborador al cambiar de área
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Elegir área" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">—</SelectItem>
                    {areas.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Colaborador</Label>
                <Select value={colId} onValueChange={setColId} disabled={!area}>
                  <SelectTrigger>
                    <SelectValue placeholder={area ? 'Elegir colaborador' : 'Elegí un área primero'} />
                  </SelectTrigger>
                  <SelectContent>
                    {colsInArea.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Fecha de examen</Label>
              <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Sede</Label>
              <Select value={sede} onValueChange={setSede}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXAM_SEDES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXAM_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Resultado</Label>
              <Select value={resultado || 'none'} onValueChange={(v) => setResultado(v === 'none' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {EXAM_RESULTS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview de campos calculados */}
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted/30 p-3 text-xs sm:grid-cols-4">
            <Preview label="Próximo examen" value={next ? formatDate(next) : '—'} />
            <Preview label="Máx. subsanar" value={fix ? formatDate(fix) : '—'} />
            <Preview label="Mayor de 39" value={m39 || '—'} />
            <Preview label="Precio" value={formatMoney(precio)} />
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

function Preview({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
