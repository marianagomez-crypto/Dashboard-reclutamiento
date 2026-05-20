'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  StageBarChart,
  SourceChart,
  FunnelChart,
} from '@/components/dashboard/charts';
import {
  STAGES,
  STAGE_COLORS,
  type Candidate,
  type Vacancy,
} from '@/lib/types';
import { exportToExcel, exportToPdf } from '@/lib/export';
import { formatDate } from '@/lib/utils';

const RANGES = [
  { id: '7', label: 'Últimos 7 días' },
  { id: '30', label: 'Últimos 30 días' },
  { id: '90', label: 'Últimos 90 días' },
  { id: '365', label: 'Último año' },
  { id: 'all', label: 'Todo el periodo' },
] as const;

export function ReportsPage({
  candidates,
  vacancies,
}: {
  candidates: Candidate[];
  vacancies: Vacancy[];
}) {
  const [range, setRange] = React.useState<(typeof RANGES)[number]['id']>('30');
  const [vacancyId, setVacancyId] = React.useState<string>('all');

  const vacanciesById = React.useMemo(
    () => new Map(vacancies.map((v) => [v.id, v])),
    [vacancies],
  );

  const filtered = React.useMemo(() => {
    let list = candidates;
    if (range !== 'all') {
      const cutoff = Date.now() - Number(range) * 86_400_000;
      list = list.filter((c) => new Date(c.appliedAt).getTime() >= cutoff);
    }
    if (vacancyId !== 'all') list = list.filter((c) => c.vacancyId === vacancyId);
    return list;
  }, [candidates, range, vacancyId]);

  const stageCounts = STAGES.map((s) => ({
    stage: s,
    value: filtered.filter((c) => c.stage === s).length,
    color: STAGE_COLORS[s],
  }));
  const funnel = STAGES.map((s) => ({
    stage: s,
    value: filtered.filter((c) => c.stage === s).length,
  }));
  const sources = Object.entries(
    filtered.reduce<Record<string, number>>((acc, c) => {
      const k = String(c.source);
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  function xlsx() {
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
      })),
      `reporte-baldecash-${range}`,
    );
    toast.success('Excel generado');
  }

  function pdf() {
    exportToPdf({
      title: `Reporte de reclutamiento · ${RANGES.find((r) => r.id === range)?.label}`,
      subtitle: `${filtered.length} candidatos · ${new Date().toLocaleDateString('es-MX')}`,
      columns: ['ID', 'Nombre', 'Puesto', 'Etapa', 'Estado', 'Fuente', 'Postulación'],
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Reportes</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} candidatos en el periodo seleccionado
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={range} onValueChange={(v) => setRange(v as any)}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGES.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={vacancyId} onValueChange={setVacancyId}>
            <SelectTrigger className="w-[220px]">
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
          <Button variant="outline" size="sm" onClick={xlsx}>
            <FileSpreadsheet className="h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={pdf}>
            <FileText className="h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <StageBarChart data={stageCounts} />
        <FunnelChart data={funnel} />
        <SourceChart data={sources} />
        <Card>
          <CardHeader>
            <CardTitle>Resumen ejecutivo</CardTitle>
            <CardDescription>Snapshot del periodo</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Stat label="Total" value={filtered.length} />
            <Stat
              label="Contratados"
              value={filtered.filter((c) => c.finalStatus === 'Contratado').length}
              accent="aqua"
            />
            <Stat
              label="En proceso"
              value={filtered.filter((c) => c.finalStatus === 'En proceso').length}
              accent="gold"
            />
            <Stat
              label="Caídos"
              value={
                filtered.filter(
                  (c) => c.finalStatus === 'Se cayó' || c.finalStatus === 'No seleccionado',
                ).length
              }
              accent="destructive"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Detalle</CardTitle>
            <CardDescription>{filtered.length} registros</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={xlsx}>
            <Download className="h-4 w-4" />
            Descargar
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-4 py-3 text-left">Candidato</th>
                <th className="px-4 py-3 text-left">Puesto</th>
                <th className="px-4 py-3 text-left">Etapa</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Fuente</th>
                <th className="px-4 py-3 text-left">Postulación</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 60).map((c) => (
                <tr key={c.id} className="border-t border-border/60">
                  <td className="px-4 py-2 text-xs text-muted-foreground">{c.id}</td>
                  <td className="px-4 py-2 font-medium">{c.name}</td>
                  <td className="px-4 py-2">
                    {vacanciesById.get(c.vacancyId || '')?.title || '-'}
                  </td>
                  <td className="px-4 py-2">{c.stage}</td>
                  <td className="px-4 py-2">{c.finalStatus}</td>
                  <td className="px-4 py-2">{String(c.source)}</td>
                  <td className="px-4 py-2">{formatDate(c.appliedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 60 && (
            <p className="px-4 py-3 text-xs text-muted-foreground">
              Mostrando 60 de {filtered.length}. Exporta para ver todo.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = 'blue',
}: {
  label: string;
  value: number;
  accent?: 'blue' | 'aqua' | 'gold' | 'destructive';
}) {
  const map = {
    blue: 'from-brand-blue-100 to-brand-blue-200 text-brand-blue-700',
    aqua: 'from-brand-aqua-100 to-brand-aqua-200 text-brand-aqua-700',
    gold: 'from-brand-gold-100 to-brand-gold-200 text-brand-gold-700',
    destructive: 'from-destructive/15 to-destructive/25 text-destructive',
  };
  return (
    <div className={`rounded-xl bg-gradient-to-br ${map[accent]} p-4`}>
      <p className="text-xs font-medium uppercase tracking-wider opacity-70">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold">{value}</p>
    </div>
  );
}
