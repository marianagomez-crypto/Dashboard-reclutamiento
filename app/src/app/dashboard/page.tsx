import {
  Briefcase,
  CheckCircle2,
  Clock,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { getRepo } from '@/lib/data/repository';
import { getSession } from '@/lib/auth/session';
import { KpiCard } from '@/components/dashboard/kpi-card';
import {
  DropReasonsChart,
  NotSelectedByStageChart,
  SourceChart,
  StageBarChart,
  TrendChart,
} from '@/components/dashboard/charts';
import { STAGE_COLORS, STAGES, type Stage } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

export const metadata = { title: 'Resumen' };
export const dynamic = 'force-dynamic';

async function fetchData() {
  const repo = await getRepo();
  const [candidates, vacancies] = await Promise.all([
    repo.listCandidates(),
    repo.listVacancies(),
  ]);

  const now = Date.now();
  const weekAgo = now - 7 * 86_400_000;
  const monthAgo = now - 30 * 86_400_000;
  const twoMonthsAgo = now - 60 * 86_400_000;

  const newThisWeek = candidates.filter(
    (c) => c.appliedAt && new Date(c.appliedAt).getTime() >= weekAgo,
  ).length;
  const candidatesPrevWeek = candidates.filter((c) => {
    if (!c.appliedAt) return false;
    const t = new Date(c.appliedAt).getTime();
    return t >= weekAgo - 7 * 86_400_000 && t < weekAgo;
  }).length;

  const hired = candidates.filter((c) => c.finalStatus === 'Contratado');
  const hiresThisMonth = hired.filter(
    (c) => c.appliedAt && new Date(c.appliedAt).getTime() >= monthAgo,
  ).length;
  const hiresPrevMonth = hired.filter((c) => {
    if (!c.appliedAt) return false;
    const t = new Date(c.appliedAt).getTime();
    return t >= twoMonthsAgo && t < monthAgo;
  }).length;

  // Conversión MENSUAL — calculada solo con candidatos del último mes
  // Fórmula: Contratado / (Contratado + Se cayó)
  // (excluye "No seleccionado" porque es decisión interna de descarte)
  const inLastMonth = (c: (typeof candidates)[number]) =>
    c.appliedAt && new Date(c.appliedAt).getTime() >= monthAgo;
  const hiredThisMonthSet = candidates.filter(
    (c) => c.finalStatus === 'Contratado' && inLastMonth(c),
  );
  const droppedThisMonth = candidates.filter(
    (c) => c.finalStatus === 'Se cayó' && inLastMonth(c),
  );
  const resolvedThisMonth = hiredThisMonthSet.length + droppedThisMonth.length;
  const conversionRate =
    resolvedThisMonth > 0
      ? (hiredThisMonthSet.length / resolvedThisMonth) * 100
      : 0;

  const hiredWithDate = hired.filter((c) => !!c.appliedAt);
  const avgTimeToHireDays =
    hiredWithDate.length === 0
      ? 0
      : hiredWithDate.reduce(
          (acc, c) =>
            acc + (Date.now() - new Date(c.appliedAt).getTime()) / 86_400_000,
          0,
        ) / hiredWithDate.length;

  // Distribución por etapa: SOLO candidatos con Estado Final = "En proceso"
  const stageCounts = STAGES.reduce(
    (acc, s) => ({ ...acc, [s]: 0 }),
    {} as Record<Stage, number>,
  );
  const inProcess = candidates.filter((c) => c.finalStatus === 'En proceso');
  inProcess.forEach((c) => {
    if (stageCounts[c.stage] !== undefined) stageCounts[c.stage] += 1;
  });

  // Agrupar por fecha calendario (YYYY-MM-DD) — sin afectación de zona horaria
  const dailySeries: { label: string; aplicaciones: number; contrataciones: number }[] = [];
  const apCount: Record<string, number> = {};
  const hireCount: Record<string, number> = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${day}`;
    apCount[key] = 0;
    hireCount[key] = 0;
    dailySeries.push({
      label: d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' }),
      aplicaciones: 0,
      contrataciones: 0,
    });
  }
  candidates.forEach((c) => {
    const key = (c.appliedAt || '').slice(0, 10);
    if (key && apCount[key] !== undefined) apCount[key] += 1;
  });
  hired.forEach((c) => {
    const key = (c.appliedAt || '').slice(0, 10);
    if (key && hireCount[key] !== undefined) hireCount[key] += 1;
  });
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${day}`;
    const idx = 29 - i;
    dailySeries[idx].aplicaciones = apCount[key];
    dailySeries[idx].contrataciones = hireCount[key];
  }

  const bySource: Record<string, number> = {};
  candidates.forEach(
    (c) => (bySource[String(c.source)] = (bySource[String(c.source)] || 0) + 1),
  );
  const sources = Object.entries(bySource)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const stageBar = STAGES.map((s) => ({
    stage: s,
    value: stageCounts[s] || 0,
    color: STAGE_COLORS[s],
  }));

  // ---- No seleccionados por etapa (decisión interna de descarte) ----
  const notSelectedByStage = STAGES.map((s) => ({
    stage: s,
    value: candidates.filter(
      (c) => c.finalStatus === 'No seleccionado' && c.stage === s,
    ).length,
  })).filter((d) => d.value > 0);
  const notSelectedTotal = notSelectedByStage.reduce((acc, d) => acc + d.value, 0);

  // ---- Motivos de caída (decisión del candidato) ----
  const dropped = candidates.filter((c) => c.finalStatus === 'Se cayó');
  const dropReasons = [
    'No asistió',
    'Desistió',
    'Fue contratado en otra empresa',
  ].map((reason) => ({
    reason,
    value: dropped.filter((c) => c.dropReason === reason).length,
  }));
  const dropReasonsTotal = dropped.length;

  return {
    kpi: {
      totalCandidates: candidates.length,
      newThisWeek,
      activeVacancies: vacancies.filter((v) => v.status === 'Abierta').length,
      hiresThisMonth,
      conversionRate: Math.round(conversionRate * 10) / 10,
      avgTimeToHireDays: Math.round(avgTimeToHireDays),
      trendCandidates:
        candidatesPrevWeek === 0
          ? 100
          : Math.round(((newThisWeek - candidatesPrevWeek) / candidatesPrevWeek) * 100),
      trendHires:
        hiresPrevMonth === 0
          ? 100
          : Math.round(((hiresThisMonth - hiresPrevMonth) / hiresPrevMonth) * 100),
    },
    dailySeries,
    sources,
    stageBar,
    notSelectedByStage,
    notSelectedTotal,
    dropReasons,
    dropReasonsTotal,
    source: repo.source(),
  };
}

export default async function DashboardPage() {
  const data = await fetchData();
  const session = await getSession();

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-blue-700 via-brand-blue-500 to-brand-aqua-600 p-8 text-white shadow-card-elevated">
        <div className="absolute inset-0 mesh-brand opacity-40" />
        <div className="absolute inset-0 grid-bg opacity-10" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-white/70">
              {new Date().toLocaleDateString('es-MX', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
              Hola, {session?.name.split(' ')[0]} 👋
            </h1>
            <p className="mt-1 max-w-xl text-sm text-white/85">
              Aqui esta el panorama de tu pipeline de reclutamiento en tiempo real.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <Badge variant="aqua" className="bg-white/20 text-white border-white/30">
              <span className="relative mr-1 flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-aqua-200 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-aqua-200" />
              </span>
              Conectado · {data.source}
            </Badge>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Candidatos"
          value={data.kpi.totalCandidates}
          icon={<Users />}
          accent="blue"
          delay={0}
          hint="Total"
        />
        <KpiCard
          label="Nuevos / semana"
          value={data.kpi.newThisWeek}
          icon={<UserPlus />}
          accent="aqua"
          trend={data.kpi.trendCandidates}
          delay={0.05}
        />
        <KpiCard
          label="Vacantes activas"
          value={data.kpi.activeVacancies}
          icon={<Briefcase />}
          accent="gold"
          delay={0.1}
          hint="Abiertas"
        />
        <KpiCard
          label="Contrataciones / mes"
          value={data.kpi.hiresThisMonth}
          icon={<CheckCircle2 />}
          accent="aqua"
          trend={data.kpi.trendHires}
          delay={0.15}
        />
        <KpiCard
          label="Conversión / mes"
          value={data.kpi.conversionRate}
          suffix="%"
          icon={<TrendingUp />}
          accent="blue"
          delay={0.2}
          hint="Últimos 30 d"
        />
        <KpiCard
          label="Time-to-hire"
          value={data.kpi.avgTimeToHireDays}
          suffix="d"
          icon={<Clock />}
          accent="gold"
          delay={0.25}
          hint="Promedio"
        />
      </section>

      {/* Charts row */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <TrendChart data={data.dailySeries} />
        </div>
        <SourceChart data={data.sources} />
      </section>

      {/* Análisis de pérdida: descarte vs abandono */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <NotSelectedByStageChart
          data={data.notSelectedByStage}
          total={data.notSelectedTotal}
        />
        <DropReasonsChart data={data.dropReasons} total={data.dropReasonsTotal} />
      </section>

      <section>
        <StageBarChart
          data={data.stageBar}
          title="Distribución por etapa · Candidatos en proceso"
          description={`${data.stageBar.reduce((acc, d) => acc + d.value, 0)} candidatos activos en el pipeline`}
        />
      </section>

    </div>
  );
}
