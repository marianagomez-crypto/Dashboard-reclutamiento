'use client';

import * as React from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { STAGE_COLORS, type Stage } from '@/lib/types';
import { Filter, UserX, TrendingDown, Lightbulb, ChevronDown } from 'lucide-react';

const PIE_COLORS = ['#31359C', '#00A29B', '#FDCA56', '#6873D7', '#36B7B3', '#D1A646', '#98A9DF'];

// Colores de prioridad (rojo / azul / verde brand)
const PRIORITY_COLORS: Record<string, { from: string; to: string; solid: string }> = {
  Alta:  { from: '#F08585', to: '#D14646', solid: '#D14646' },
  Media: { from: '#6873D7', to: '#31359C', solid: '#31359C' },
  Baja:  { from: '#4FC3B8', to: '#00A29B', solid: '#00A29B' },
};

interface DailyPoint {
  label: string;
  aplicaciones: number;
  contrataciones: number;
}

export function TrendChart({ data }: { data: DailyPoint[] }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>Tendencia de actividad</CardTitle>
        <CardDescription>
          Aplicaciones y contrataciones — últimos 30 días
        </CardDescription>
      </CardHeader>
      <CardContent>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7 }}
          className="h-72 w-full rounded-xl bg-muted/40 p-3"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: 0, right: 16, top: 20, bottom: 0 }}>
              <defs>
                <linearGradient id="g-apl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#31359C" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#31359C" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g-hire" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00A29B" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#00A29B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 4" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="label"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, opacity: 0.3 }}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--popover))',
                  fontSize: 12,
                  boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
              <Area
                type="monotone"
                dataKey="aplicaciones"
                name="Aplicaciones"
                stroke="#31359C"
                strokeWidth={2.5}
                fill="url(#g-apl)"
                activeDot={{ r: 5 }}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (!payload || payload.aplicaciones === 0) return <g />;
                  return (
                    <circle
                      key={`dot-apl-${cx}-${cy}`}
                      cx={cx}
                      cy={cy}
                      r={3}
                      fill="#31359C"
                      stroke="#fff"
                      strokeWidth={1.5}
                    />
                  );
                }}
              >
                <LabelList
                  dataKey="aplicaciones"
                  position="top"
                  formatter={(v: any) => (Number(v) > 0 ? v : '')}
                  fontSize={10}
                  fill="#31359C"
                  fontWeight={600}
                />
              </Area>
              <Area
                type="monotone"
                dataKey="contrataciones"
                name="Contrataciones"
                stroke="#00A29B"
                strokeWidth={2.5}
                fill="url(#g-hire)"
                activeDot={{ r: 5 }}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (!payload || payload.contrataciones === 0) return <g />;
                  return (
                    <circle
                      key={`dot-hire-${cx}-${cy}`}
                      cx={cx}
                      cy={cy}
                      r={3}
                      fill="#00A29B"
                      stroke="#fff"
                      strokeWidth={1.5}
                    />
                  );
                }}
              >
                <LabelList
                  dataKey="contrataciones"
                  position="bottom"
                  formatter={(v: any) => (Number(v) > 0 ? v : '')}
                  fontSize={10}
                  fill="#00A29B"
                  fontWeight={600}
                />
              </Area>
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </CardContent>
    </Card>
  );
}

export function FunnelChart({ data }: { data: { stage: Stage; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Embudo de reclutamiento</CardTitle>
        <CardDescription>Distribución por etapa</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 rounded-xl bg-muted/40 p-5">
          {data.map((d, i) => (
            <motion.div
              key={d.stage}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-semibold text-foreground">{d.stage}</span>
                <span className="tabular-nums font-bold text-foreground">{d.value}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-background">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(d.value / max) * 100}%` }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${STAGE_COLORS[d.stage]}99, ${STAGE_COLORS[d.stage]})`,
                    boxShadow: `0 0 12px ${STAGE_COLORS[d.stage]}40`,
                  }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function SourceChart({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  const sorted = [...data].sort((a, b) => b.value - a.value);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fuentes de candidatos</CardTitle>
        <CardDescription>Top canales de adquisición · {total} total</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl bg-muted/40 p-4">
          {/* Donut con total al centro */}
          <div className="relative mx-auto h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="62%"
                  outerRadius="92%"
                  paddingAngle={3}
                  strokeWidth={0}
                  startAngle={90}
                  endAngle={-270}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--popover))',
                    fontSize: 12,
                  }}
                  formatter={(v: any, name: any) => [
                    `${v} (${total > 0 ? Math.round((Number(v) / total) * 100) : 0}%)`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-3xl font-bold leading-none text-foreground tabular-nums">
                {total}
              </span>
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Candidatos
              </span>
            </div>
          </div>

          {/* Leyenda detallada */}
          <div className="mt-4 space-y-2">
            {sorted.map((d) => {
              const originalIndex = data.findIndex((x) => x.name === d.name);
              const color = PIE_COLORS[originalIndex % PIE_COLORS.length];
              const pct = total > 0 ? (d.value / total) * 100 : 0;
              return (
                <div
                  key={d.name}
                  className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-background/60"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: color, boxShadow: `0 0 8px ${color}66` }}
                  />
                  <span
                    className="flex-1 truncate text-sm font-medium text-foreground"
                    title={d.name}
                  >
                    {d.name}
                  </span>
                  <span className="tabular-nums text-sm font-bold text-foreground">
                    {d.value}
                  </span>
                  <span className="w-10 text-right tabular-nums text-xs font-semibold text-muted-foreground">
                    {pct.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StageBarChart({
  data,
  title = 'Distribución por etapa',
  description,
}: {
  data: { stage: string; value: number; color: string }[];
  title?: string;
  description?: string;
}) {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  const max = Math.max(...data.map((d) => d.value), 1);
  // Padding extra para que las labels (valor) no se corten al final
  const xMax = Math.ceil(max * 1.18) + 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description || `${total} candidatos en el pipeline`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[360px] w-full rounded-xl bg-muted/40 p-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ left: 8, right: 32, top: 8, bottom: 8 }}
              barCategoryGap="22%"
            >
              <defs>
                {data.map((d, i) => (
                  <linearGradient
                    key={`bar-grad-${i}`}
                    id={`bar-grad-${i}`}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="0"
                  >
                    <stop offset="0%" stopColor={d.color} stopOpacity={0.55} />
                    <stop offset="100%" stopColor={d.color} stopOpacity={1} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                strokeDasharray="3 4"
                stroke="hsl(var(--border))"
                horizontal={false}
              />
              <XAxis
                type="number"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                domain={[0, xMax]}
                hide={false}
              />
              <YAxis
                type="category"
                dataKey="stage"
                stroke="hsl(var(--foreground))"
                fontSize={12}
                fontWeight={600}
                tickLine={false}
                axisLine={false}
                width={120}
                interval={0}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.35 }}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--popover))',
                  fontSize: 12,
                }}
                formatter={(v: any) => [`${v} candidatos`, '']}
              />
              <Bar dataKey="value" radius={[0, 10, 10, 0]} minPointSize={3}>
                {data.map((_, i) => (
                  <Cell key={i} fill={`url(#bar-grad-${i})`} />
                ))}
                <LabelList
                  dataKey="value"
                  position="right"
                  fontSize={13}
                  fontWeight={800}
                  fill="hsl(var(--foreground))"
                  offset={8}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// No seleccionados por etapa — dónde descarta el proceso
// ============================================================================
export function NotSelectedByStageChart({
  data,
  total,
}: {
  data: { stage: string; value: number }[];
  total: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const topStage = data.length
    ? [...data].sort((a, b) => b.value - a.value)[0]
    : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>No seleccionados por etapa</CardTitle>
            <CardDescription>
              Dónde se descartan candidatos en el proceso
            </CardDescription>
          </div>
          <div className="rounded-xl bg-brand-blue-100 p-2 text-brand-blue-700">
            <Filter className="h-4 w-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center rounded-xl bg-muted/40 p-6 text-center">
            <UserX className="mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              Sin descartes aún
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Aquí aparecerán los candidatos marcados como
              <br />
              "No seleccionado" agrupados por etapa.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3 rounded-xl bg-muted/40 p-5">
              {data.map((d, i) => {
                const pct = total > 0 ? (d.value / total) * 100 : 0;
                return (
                  <motion.div
                    key={d.stage}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-semibold text-foreground">{d.stage}</span>
                      <span className="tabular-nums text-xs text-muted-foreground">
                        <span className="font-bold text-foreground">{d.value}</span>{' '}
                        · {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-background">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(d.value / max) * 100}%` }}
                        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full"
                        style={{
                          background:
                            'linear-gradient(90deg, #98A9DF, #6873D7)',
                          boxShadow: '0 0 12px rgba(104,115,215,0.30)',
                        }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
            {topStage && (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-brand-blue-100 bg-brand-blue-100/40 p-3">
                <Lightbulb className="h-4 w-4 shrink-0 text-brand-blue-600" />
                <p className="text-xs leading-relaxed text-brand-blue-700">
                  La mayoría de descartes ({topStage.value} de {total}) ocurre en{' '}
                  <span className="font-bold">{topStage.stage}</span>.
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Motivos de caída — por qué abandonan los candidatos
// ============================================================================
const DROP_PALETTE: Record<string, { from: string; to: string; tint: string }> = {
  'No asistió': {
    from: '#FBA8A8',
    to: '#D14646',
    tint: 'rgba(209,70,70,0.30)',
  },
  Desistió: {
    from: '#F2C0D8',
    to: '#D17AA6',
    tint: 'rgba(209,122,166,0.30)',
  },
  'Fue contratado en otra empresa': {
    from: '#8DD9D6',
    to: '#36B7B3',
    tint: 'rgba(54,183,179,0.30)',
  },
};

export function DropReasonsChart({
  data,
  total,
}: {
  data: { reason: string; value: number }[];
  total: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const top = total > 0 ? [...data].sort((a, b) => b.value - a.value)[0] : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Motivos de caída</CardTitle>
            <CardDescription>
              Por qué los candidatos abandonan el proceso
            </CardDescription>
          </div>
          <div className="rounded-xl bg-destructive/10 p-2 text-destructive">
            <TrendingDown className="h-4 w-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center rounded-xl bg-muted/40 p-6 text-center">
            <UserX className="mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              Sin abandonos registrados
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Aquí aparecerán los candidatos marcados como
              <br />
              "Se cayó" agrupados por motivo.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3 rounded-xl bg-muted/40 p-5">
              {data.map((d, i) => {
                const pct = total > 0 ? (d.value / total) * 100 : 0;
                const palette = DROP_PALETTE[d.reason] || DROP_PALETTE['Desistió'];
                return (
                  <motion.div
                    key={d.reason}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-semibold text-foreground">
                        {d.reason}
                      </span>
                      <span className="tabular-nums text-xs text-muted-foreground">
                        <span className="font-bold text-foreground">{d.value}</span>{' '}
                        · {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-background">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(d.value / max) * 100}%` }}
                        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full"
                        style={{
                          background: `linear-gradient(90deg, ${palette.from}, ${palette.to})`,
                          boxShadow: `0 0 12px ${palette.tint}`,
                        }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Total caídas
                </p>
                <p className="mt-0.5 font-display text-2xl font-bold text-foreground">
                  {total}
                </p>
              </div>
              {top && (
                <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive">
                    Motivo principal
                  </p>
                  <p
                    className="mt-0.5 truncate font-display text-sm font-bold text-destructive"
                    title={top.reason}
                  >
                    {top.reason}
                  </p>
                  <p className="text-[10px] text-destructive/80">
                    {top.value} de {total} ({Math.round((top.value / total) * 100)}%)
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Costo de fuentes por vacante (stacked bar horizontal por canal)
// ============================================================================
export interface SourceCostRow {
  vacancyId: string;
  vacancyTitle: string;
  total: number;
  // Costo desagregado por canal (Linkedin: 200, Bumeran: 100, ...)
  byChannel: Record<string, number>;
}

// Mismo color que usa SourcesPage para los chips de canal (consistencia visual).
const CHANNEL_COLOR_PALETTE: Record<string, string> = {
  Linkedin: '#31359C',
  Bumeran: '#00A29B',
  Facebook: '#6873D7',
  Referidos: '#36B7B3',
  'Universidad de Lima': '#FDCA56',
  'Universidad del Pacífico': '#98A9DF',
};
const FALLBACK_COLORS = ['#D14646', '#987933', '#4453A0', '#A9DAE6', '#D1A646'];

function channelColor(name: string, fallbackIndex: number): string {
  return (
    CHANNEL_COLOR_PALETTE[name] ||
    FALLBACK_COLORS[fallbackIndex % FALLBACK_COLORS.length]
  );
}

export function SourceCostByVacancyChart({
  data,
  channels,
}: {
  data: SourceCostRow[];
  channels: string[];
}) {
  // Solo mostrar vacantes con costo > 0
  const filtered = data.filter((d) => d.total > 0);
  const sorted = [...filtered].sort((a, b) => b.total - a.total);
  const maxTotal = Math.max(...sorted.map((d) => d.total), 1);
  const xMax = Math.ceil((maxTotal * 1.15) / 100) * 100 || 100;

  const total = sorted.reduce((acc, d) => acc + d.total, 0);
  const top = sorted[0];

  // Asigna color a cada canal del dataset
  const colorByChannel: Record<string, string> = {};
  channels.forEach((c, i) => {
    colorByChannel[c] = channelColor(c, i);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Costo de fuentes por vacante</CardTitle>
        <CardDescription>
          Inversión mensual en canales de adquisición · stacked por canal
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center rounded-xl bg-muted/40 p-6 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Sin fuentes pagas registradas
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Cuando alguna fuente tenga costo mensual mayor que cero aparecerá aquí.
            </p>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Vacantes con costo
                </p>
                <p className="mt-0.5 font-display text-2xl font-bold tabular-nums">
                  {sorted.length}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Total mensual
                </p>
                <p className="mt-0.5 font-display text-2xl font-bold tabular-nums">
                  {formatPEN(total)}
                </p>
              </div>
              {top && (
                <div className="col-span-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3 sm:col-span-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive">
                    Más cara
                  </p>
                  <p
                    className="mt-0.5 truncate font-display text-sm font-bold text-destructive"
                    title={top.vacancyTitle}
                  >
                    {top.vacancyTitle}
                  </p>
                  <p className="text-[10px] text-destructive/80 tabular-nums">
                    {formatPEN(top.total)} / mes
                  </p>
                </div>
              )}
            </div>

            {/* Leyenda de canales */}
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
              {channels.map((c) => (
                <LegendDot key={c} color={colorByChannel[c]} label={c} />
              ))}
            </div>

            {/* Bar chart stacked */}
            <div className="w-full rounded-xl bg-muted/40 p-3">
              <div
                style={{
                  height: Math.max(sorted.length * 52 + 40, 220),
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sorted}
                    layout="vertical"
                    margin={{ left: 8, right: 60, top: 8, bottom: 8 }}
                    barCategoryGap="22%"
                  >
                    <CartesianGrid
                      strokeDasharray="3 4"
                      stroke="hsl(var(--border))"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      domain={[0, xMax]}
                      tickFormatter={(v: any) => `S/ ${v}`}
                      label={{
                        value: 'S/',
                        position: 'insideBottomRight',
                        offset: -4,
                        style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))' },
                      }}
                    />
                    <YAxis
                      type="category"
                      dataKey="vacancyTitle"
                      stroke="hsl(var(--foreground))"
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      width={220}
                      tick={<VacancyYAxisTick />}
                    />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid hsl(var(--border))',
                        background: 'hsl(var(--popover))',
                        fontSize: 12,
                        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                      }}
                      formatter={(value: any, name: any) => [formatPEN(Number(value)), name]}
                      labelFormatter={(label: any, payload: any) => {
                        const row = payload?.[0]?.payload as SourceCostRow | undefined;
                        if (!row) return label;
                        return `${row.vacancyTitle} · Total: ${formatPEN(row.total)}`;
                      }}
                    />
                    {channels.map((c) => (
                      <Bar
                        key={c}
                        dataKey={`byChannel.${c}`}
                        name={c}
                        stackId="cost"
                        fill={colorByChannel[c]}
                        minPointSize={2}
                      />
                    ))}
                    {/* Label con el total al final de cada barra */}
                    <Bar
                      dataKey="total"
                      stackId="total-label"
                      fill="transparent"
                      isAnimationActive={false}
                    >
                      <LabelList
                        dataKey="total"
                        position="right"
                        offset={8}
                        fontSize={12}
                        fontWeight={800}
                        fill="hsl(var(--foreground))"
                        formatter={(v: any) => formatPEN(Number(v))}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Comparacion salario final vs banda salarial (range markers / lollipop)
// ============================================================================
export interface SalaryComparisonRow {
  candidateId: string;
  candidateName: string;
  vacancyTitle: string;
  min: number;
  max: number;
  final: number;
}

function formatPEN(n: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    maximumFractionDigits: 0,
  }).format(n);
}

export function SalaryComparisonChart({
  data,
  skipped = 0,
}: {
  data: SalaryComparisonRow[];
  skipped?: number;
}) {
  // Stats agregadas
  const within = data.filter((d) => d.final >= d.min && d.final <= d.max).length;
  const below = data.filter((d) => d.final < d.min).length;
  const above = data.filter((d) => d.final > d.max).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Salario final vs banda salarial</CardTitle>
            <CardDescription>
              Cada barra muestra el rango de su propia vacante. El círculo marca lo que se ofreció.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <LegendDot color="#00A29B" label="Dentro" />
            <LegendDot color="#FDCA56" label="Bajo el mín." />
            <LegendDot color="#D14646" label="Sobre el máx." />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center rounded-xl bg-muted/40 p-6 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Sin datos suficientes para comparar
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Necesitás ingresos con salario final + un rango salarial para esa vacante.
            </p>
          </div>
        ) : (
          <>
            {/* Stats compactas */}
            <div className="mb-4 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Dentro del rango
                </p>
                <p className="mt-0.5 font-display text-2xl font-bold text-foreground tabular-nums">
                  {within}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Bajo el mín.
                </p>
                <p className="mt-0.5 font-display text-2xl font-bold tabular-nums">
                  {below}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Sobre el máx.
                </p>
                <p className="mt-0.5 font-display text-2xl font-bold tabular-nums">
                  {above}
                </p>
              </div>
            </div>

            {/* Filas con escala individual por vacante */}
            <div className="space-y-6 rounded-xl bg-muted/40 p-4">
              {data.map((row, i) => (
                <SalaryRow key={row.candidateId} row={row} index={i} />
              ))}
            </div>

            {skipped > 0 && (
              <p className="mt-3 text-[11px] text-muted-foreground">
                {skipped}{' '}
                {skipped === 1
                  ? 'ingreso fue excluido'
                  : 'ingresos fueron excluidos'}{' '}
                por falta de salario final o de rango salarial en su vacante.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// La banda ocupa el 80% central. El 10% a cada lado se reserva para mostrar
// el dot cuando el salario final cae fuera del rango (below / above).
const BAND_START_PCT = 10;
const BAND_END_PCT = 90;
const BAND_WIDTH_PCT = BAND_END_PCT - BAND_START_PCT; // 80

function SalaryRow({ row, index }: { row: SalaryComparisonRow; index: number }) {
  const { min, max, final } = row;
  const range = max - min;

  let status: 'within' | 'below' | 'above' = 'within';
  if (final < min) status = 'below';
  else if (final > max) status = 'above';

  const dotColor =
    status === 'within' ? '#00A29B' : status === 'below' ? '#FDCA56' : '#D14646';

  // Posicion del dot en el container (0-100%).
  // - within: lineal dentro del 10%-90% segun (final-min)/(max-min)
  // - below : 4% (a la izquierda fuera de la banda)
  // - above : 96% (a la derecha fuera de la banda)
  let dotLeftPct: number;
  if (status === 'within') {
    const t = range > 0 ? (final - min) / range : 0.5;
    dotLeftPct = BAND_START_PCT + t * BAND_WIDTH_PCT;
  } else if (status === 'below') {
    dotLeftPct = 4;
  } else {
    dotLeftPct = 96;
  }

  // Texto del estado
  const statusText =
    status === 'within'
      ? 'Dentro del rango'
      : status === 'below'
        ? `${formatPEN(min - final)} bajo el mínimo`
        : `${formatPEN(final - max)} sobre el máximo`;

  const statusBg =
    status === 'within'
      ? 'rgba(0,162,155,0.12)'
      : status === 'below'
        ? 'rgba(253,202,86,0.18)'
        : 'rgba(209,70,70,0.14)';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
    >
      {/* Header de la fila */}
      <div className="mb-2.5 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground" title={row.candidateName}>
            {row.candidateName}
          </p>
          <p className="truncate text-[11px] text-muted-foreground" title={row.vacancyTitle}>
            {row.vacancyTitle}
          </p>
        </div>
        <span
          className="rounded-full px-3 py-1 text-[11px] font-semibold tabular-nums"
          style={{ background: statusBg, color: dotColor }}
        >
          {statusText}
        </span>
      </div>

      {/* Banda salarial + dot del final */}
      <div className="relative h-12">
        {/* Track de fondo sutil del container completo (referencia visual) */}
        <div className="absolute inset-x-0 top-[18px] h-3 rounded-full bg-foreground/5" />

        {/* La banda salarial: ocupa el 10%-90% del container */}
        <div
          className="absolute top-[16px] h-3.5 rounded-full shadow-inner"
          style={{
            left: `${BAND_START_PCT}%`,
            right: `${100 - BAND_END_PCT}%`,
            background:
              'linear-gradient(90deg, #BEF7F3 0%, #5CBFBE 50%, #00A29B 100%)',
            boxShadow: '0 1px 3px rgba(0,162,155,0.25) inset',
          }}
        />

        {/* Borde de los extremos de la banda (tickmarks) */}
        <div
          className="absolute top-[13px] h-[22px] w-[2.5px] rounded-full"
          style={{
            left: `${BAND_START_PCT}%`,
            transform: 'translateX(-50%)',
            background: '#00A29B',
          }}
        />
        <div
          className="absolute top-[13px] h-[22px] w-[2.5px] rounded-full"
          style={{
            left: `${BAND_END_PCT}%`,
            transform: 'translateX(-50%)',
            background: '#00A29B',
          }}
        />

        {/* Labels de min y max en los extremos de la banda */}
        <span
          className="absolute top-[40px] text-[11px] font-semibold tabular-nums text-foreground/70"
          style={{
            left: `${BAND_START_PCT}%`,
            transform: 'translateX(-50%)',
          }}
        >
          {formatPEN(min)}
        </span>
        <span
          className="absolute top-[40px] text-[11px] font-semibold tabular-nums text-foreground/70"
          style={{
            left: `${BAND_END_PCT}%`,
            transform: 'translateX(-50%)',
          }}
        >
          {formatPEN(max)}
        </span>

        {/* Etiqueta del salario final ARRIBA del dot */}
        <span
          className="absolute top-0 whitespace-nowrap text-[12px] font-bold tabular-nums"
          style={{
            left: `${dotLeftPct}%`,
            transform: 'translateX(-50%)',
            color: dotColor,
          }}
        >
          {formatPEN(final)}
        </span>

        {/* Dot del salario final */}
        <span
          className="absolute top-[18px] h-5 w-5 rounded-full border-[3px] border-white shadow-lg transition-transform hover:scale-110 dark:border-zinc-900"
          style={{
            left: `${dotLeftPct}%`,
            transform: 'translateX(-50%)',
            background: dotColor,
            boxShadow: `0 0 0 4px ${dotColor}22, 0 4px 12px ${dotColor}66`,
          }}
          title={`${formatPEN(final)} — ${statusText}`}
        />
      </div>
    </motion.div>
  );
}

// Custom tick para el eje Y del aging chart: wrap a 2 lineas si el texto es largo.
function VacancyYAxisTick(props: any) {
  const { x, y, payload } = props;
  const text: string = String(payload?.value ?? '');
  const MAX = 28; // chars que entran comodos en ~220px @ 12px

  if (text.length <= MAX) {
    return (
      <text
        x={x}
        y={y}
        dy={4}
        textAnchor="end"
        fontSize={12}
        fill="hsl(var(--foreground))"
        fontWeight={500}
      >
        {text}
      </text>
    );
  }

  // Partir por palabras conservando la primera linea <= MAX chars
  const words = text.split(' ');
  let line1 = '';
  let rest: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const candidate = line1 ? `${line1} ${words[i]}` : words[i];
    if (candidate.length <= MAX) {
      line1 = candidate;
    } else {
      rest = words.slice(i);
      break;
    }
  }
  let line2 = rest.join(' ');
  if (line2.length > MAX) line2 = line2.slice(0, MAX - 1) + '…';

  return (
    <text
      x={x}
      y={y}
      textAnchor="end"
      fontSize={12}
      fill="hsl(var(--foreground))"
      fontWeight={500}
    >
      <tspan x={x} dy="-0.35em">
        {line1 || text.slice(0, MAX)}
      </tspan>
      <tspan x={x} dy="1.2em">
        {line2}
      </tspan>
    </text>
  );
}

// ============================================================================
// Antiguedad de vacantes abiertas — dias transcurridos desde la apertura
// ============================================================================
export interface VacancyAgingRow {
  id: string;
  title: string;
  daysOpen: number;
  priority: 'Alta' | 'Media' | 'Baja' | string;
}

export function VacancyAgingChart({ data }: { data: VacancyAgingRow[] }) {
  const sorted = [...data].sort((a, b) => b.daysOpen - a.daysOpen);
  const avg =
    sorted.length === 0
      ? 0
      : Math.round(sorted.reduce((acc, d) => acc + d.daysOpen, 0) / sorted.length);
  const oldest = sorted[0];

  // Para que las barras no se aplasten cuando hay pocas vacantes,
  // pongo un dominio minimo razonable en el eje Y.
  const maxDays = Math.max(...sorted.map((d) => d.daysOpen), 1);
  const yMax = Math.ceil(maxDays * 1.15);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Antigüedad de vacantes abiertas</CardTitle>
            <CardDescription>
              Días transcurridos desde la apertura · color por prioridad
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <LegendDot color={PRIORITY_COLORS.Alta.solid} label="Alta" />
            <LegendDot color={PRIORITY_COLORS.Media.solid} label="Media" />
            <LegendDot color={PRIORITY_COLORS.Baja.solid} label="Baja" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center rounded-xl bg-muted/40 p-6 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Sin vacantes abiertas
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Cuando haya vacantes en estado "Abierta" se verán aquí.
            </p>
          </div>
        ) : (
          <>
            {/* Stat cards de contexto */}
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Abiertas
                </p>
                <p className="mt-0.5 font-display text-2xl font-bold text-foreground tabular-nums">
                  {sorted.length}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Promedio días
                </p>
                <p className="mt-0.5 font-display text-2xl font-bold text-foreground tabular-nums">
                  {avg}
                </p>
              </div>
              {oldest && (
                <div className="col-span-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3 sm:col-span-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive">
                    Más antigua
                  </p>
                  <p
                    className="mt-0.5 truncate font-display text-sm font-bold text-destructive"
                    title={oldest.title}
                  >
                    {oldest.title}
                  </p>
                  <p className="text-[10px] text-destructive/80 tabular-nums">
                    {oldest.daysOpen} días
                  </p>
                </div>
              )}
            </div>

            <div className="w-full rounded-xl bg-muted/40 p-3">
              <div
                style={{
                  // 52px por barra acomoda labels en 2 lineas; minimo razonable
                  height: Math.max(sorted.length * 52 + 40, 220),
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sorted}
                    layout="vertical"
                    margin={{ left: 8, right: 44, top: 8, bottom: 8 }}
                    barCategoryGap="22%"
                  >
                    <defs>
                      {(['Alta', 'Media', 'Baja'] as const).map((p) => {
                        const c = PRIORITY_COLORS[p];
                        return (
                          <linearGradient
                            key={`prio-${p}`}
                            id={`prio-${p}`}
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="0"
                          >
                            <stop offset="0%" stopColor={c.from} stopOpacity={0.7} />
                            <stop offset="100%" stopColor={c.to} stopOpacity={1} />
                          </linearGradient>
                        );
                      })}
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 4"
                      stroke="hsl(var(--border))"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      domain={[0, yMax]}
                      label={{
                        value: 'días',
                        position: 'insideBottomRight',
                        offset: -4,
                        style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))' },
                      }}
                    />
                    <YAxis
                      type="category"
                      dataKey="title"
                      stroke="hsl(var(--foreground))"
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      width={240}
                      tick={<VacancyYAxisTick />}
                    />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid hsl(var(--border))',
                        background: 'hsl(var(--popover))',
                        fontSize: 12,
                        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                      }}
                      formatter={(value: any) => [`${value} días`, 'Abierta hace']}
                      labelFormatter={(label: any, payload: any) => {
                        const row = payload?.[0]?.payload as VacancyAgingRow | undefined;
                        if (!row) return label;
                        return `${row.title} · ${row.priority}`;
                      }}
                    />
                    <Bar dataKey="daysOpen" radius={[0, 8, 8, 0]} minPointSize={4}>
                      {sorted.map((d, i) => {
                        const palette =
                          PRIORITY_COLORS[d.priority] || PRIORITY_COLORS.Media;
                        const grad = `url(#prio-${
                          (['Alta', 'Media', 'Baja'] as const).includes(d.priority as any)
                            ? d.priority
                            : 'Media'
                        })`;
                        return (
                          <Cell key={i} fill={grad} stroke={palette.solid} strokeOpacity={0} />
                        );
                      })}
                      <LabelList
                        dataKey="daysOpen"
                        position="right"
                        fontSize={12}
                        fontWeight={800}
                        fill="hsl(var(--foreground))"
                        offset={8}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Candidatos por vacante divididos en En proceso / Finalizados
// (stacked horizontal con scroll vertical si hay muchas vacantes)
// ============================================================================
export interface CandidatesByStatusRow {
  vacancyId: string;
  vacancyTitle: string;
  enProceso: number;
  finalizados: number;
  total: number;
  // Desglose de finalizados por estado (para el detalle expandible)
  contratado: number;
  seCayo: number;
  noSeleccionado: number;
}

export function CandidatesByStatusChart({
  data,
}: {
  data: CandidatesByStatusRow[];
}) {
  // Muestra todas las vacantes recibidas (incluso con 0 candidatos),
  // ordenadas por total descendente.
  const sorted = [...data].sort((a, b) => b.total - a.total);

  const totalProc = sorted.reduce((acc, d) => acc + d.enProceso, 0);
  const totalFin = sorted.reduce((acc, d) => acc + d.finalizados, 0);
  const totalAll = totalProc + totalFin;

  // Escala COMPARTIDA: las dos barras (en proceso y finalizados) usan el mismo
  // maximo, asi se pueden comparar directamente entre si y entre vacantes.
  const maxShared = Math.max(
    ...sorted.map((d) => Math.max(d.enProceso, d.finalizados)),
    1,
  );

  const PROC_COLOR = '#3B9EE5'; // azul — en proceso
  const FIN_COLOR = '#D14646'; // rojo — finalizados

  // Fila expandida: que vacante muestra su desglose de finalizados
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  // Una sub-fila: label + barra + valor. Si onClick existe, es clickeable.
  const BarLine = ({
    label,
    value,
    color,
    onClick,
    expanded,
  }: {
    label: string;
    value: number;
    color: string;
    onClick?: () => void;
    expanded?: boolean;
  }) => {
    const clickable = !!onClick && value > 0;
    return (
      <div
        className={`flex items-center gap-3 ${
          clickable
            ? '-mx-1 cursor-pointer rounded-md px-1 py-0.5 transition hover:bg-foreground/5'
            : ''
        }`}
        onClick={clickable ? onClick : undefined}
        role={clickable ? 'button' : undefined}
        tabIndex={clickable ? 0 : undefined}
        onKeyDown={
          clickable
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick!();
                }
              }
            : undefined
        }
        title={clickable ? 'Ver desglose de finalizados' : undefined}
      >
        <span className="w-20 shrink-0 text-xs font-medium" style={{ color }}>
          {label}
        </span>
        <div className="relative h-2.5 min-w-0 flex-1">
          {value > 0 && (
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: `${Math.max((value / maxShared) * 100, 3)}%`,
                background: color,
              }}
            />
          )}
        </div>
        <span className="w-6 shrink-0 text-right text-sm font-semibold tabular-nums text-foreground">
          {value}
        </span>
        {clickable ? (
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${
              expanded ? 'rotate-180' : ''
            }`}
          />
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
      </div>
    );
  };

  // Mini-barra de un estado dentro del desglose de finalizados
  const BreakdownRow = ({
    label,
    value,
    finalizados,
    color,
  }: {
    label: string;
    value: number;
    finalizados: number;
    color: string;
  }) => {
    const v = Number.isFinite(value) ? value : 0;
    const pct = finalizados > 0 ? (v / finalizados) * 100 : 0;
    return (
      <div className="flex items-center gap-3">
        <span className="flex w-32 shrink-0 items-center gap-1.5 text-xs font-medium text-foreground">
          <span className="h-2 w-2 rounded-full" style={{ background: color }} />
          {label}
        </span>
        <div className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-foreground/5">
          <div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
        <span className="shrink-0 whitespace-nowrap text-right text-xs tabular-nums">
          <span className="font-bold text-foreground">{v}</span>
          <span className="text-muted-foreground">
            {' '}
            {v === 1 ? 'candidato' : 'candidatos'}
          </span>
        </span>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Candidatos por vacante</CardTitle>
            <CardDescription>
              Comparación de candidatos en proceso vs finalizados por vacante ·
              Ordenado por total de candidatos (mayor a menor)
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <LegendDot color={PROC_COLOR} label="En proceso" />
            <LegendDot color={FIN_COLOR} label="Finalizados" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center rounded-xl bg-muted/40 p-6 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Sin candidatos asignados a vacantes
            </p>
          </div>
        ) : (
          <>
            {/* Stat cards */}
            <div className="mb-4 grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Total candidatos
                </p>
                <p className="mt-0.5 font-display text-2xl font-bold tabular-nums">
                  {totalAll}
                </p>
                <p className="text-[10px] text-muted-foreground">En todas las vacantes</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  En proceso
                </p>
                <p
                  className="mt-0.5 font-display text-2xl font-bold tabular-nums"
                  style={{ color: PROC_COLOR }}
                >
                  {totalProc}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Candidatos activos en proceso
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Finalizados
                </p>
                <p
                  className="mt-0.5 font-display text-2xl font-bold tabular-nums"
                  style={{ color: FIN_COLOR }}
                >
                  {totalFin}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Contratados, se cayó o no seleccionados
                </p>
              </div>
            </div>

            {/* Tabla: una columna con las dos barras apiladas + scroll vertical */}
            <div className="max-h-[460px] overflow-y-auto rounded-xl border border-border scrollbar-thin">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-muted/60 text-left backdrop-blur">
                    <th className="w-[34%] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Vacante
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Cantidad de candidatos
                    </th>
                    <th className="w-16 px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row, i) => {
                    const expanded = expandedId === row.vacancyId;
                    return (
                      <React.Fragment key={row.vacancyId}>
                        <motion.tr
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(i * 0.025, 0.3) }}
                          className="border-t border-border transition-colors hover:bg-muted/30"
                        >
                          <td className="px-4 py-3 align-middle">
                            <p
                              className="truncate font-medium text-foreground"
                              title={row.vacancyTitle}
                            >
                              {row.vacancyTitle}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-2">
                              <BarLine
                                label="En proceso"
                                value={row.enProceso}
                                color={PROC_COLOR}
                              />
                              <BarLine
                                label="Finalizados"
                                value={row.finalizados}
                                color={FIN_COLOR}
                                expanded={expanded}
                                onClick={() =>
                                  setExpandedId(expanded ? null : row.vacancyId)
                                }
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right align-middle text-base font-bold tabular-nums text-foreground">
                            {row.total}
                          </td>
                        </motion.tr>

                        {/* Detalle expandible: desglose de finalizados por estado */}
                        {expanded && (
                          <tr className="border-t border-border bg-muted/20">
                            <td colSpan={3} className="px-4 py-4">
                              <div className="rounded-xl border border-border bg-card p-4">
                                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                  Desglose de finalizados · {row.vacancyTitle}
                                </p>
                                <div className="space-y-2.5">
                                  <BreakdownRow
                                    label="Contratado"
                                    value={row.contratado}
                                    finalizados={row.finalizados}
                                    color="#00A29B"
                                  />
                                  <BreakdownRow
                                    label="Se cayó"
                                    value={row.seCayo}
                                    finalizados={row.finalizados}
                                    color="#D14646"
                                  />
                                  <BreakdownRow
                                    label="No seleccionado"
                                    value={row.noSeleccionado}
                                    finalizados={row.finalizados}
                                    color="#987933"
                                  />
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Candidatos en proceso por vacante — cuantos activos tiene cada puesto
// ============================================================================
export interface CandidatesPerVacancyRow {
  vacancyId: string;
  title: string;
  count: number;
}

export function CandidatesPerVacancyChart({
  data,
}: {
  data: CandidatesPerVacancyRow[];
}) {
  const sorted = [...data].sort((a, b) => b.count - a.count);
  const maxCount = Math.max(...sorted.map((d) => d.count), 1);
  const xMax = Math.ceil(maxCount * 1.18) || 1;
  const total = sorted.reduce((acc, d) => acc + d.count, 0);
  const top = sorted[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Candidatos en proceso por vacante</CardTitle>
        <CardDescription>
          Cantidad de candidatos activos por puesto · ordenados de mayor a menor
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center rounded-xl bg-muted/40 p-6 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Sin candidatos en proceso
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Cuando haya candidatos con Estado Final "En proceso" aparecerán aquí.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Vacantes con activos
                </p>
                <p className="mt-0.5 font-display text-2xl font-bold text-foreground tabular-nums">
                  {sorted.length}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Total candidatos
                </p>
                <p className="mt-0.5 font-display text-2xl font-bold text-foreground tabular-nums">
                  {total}
                </p>
              </div>
              {top && (
                <div className="col-span-2 rounded-xl border border-brand-blue-100 bg-brand-blue-100/40 p-3 sm:col-span-1 dark:border-brand-blue-600/30 dark:bg-brand-blue-600/15">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-blue-700 dark:text-brand-blue-100">
                    Más activa
                  </p>
                  <p
                    className="mt-0.5 truncate font-display text-sm font-bold text-brand-blue-700 dark:text-brand-blue-100"
                    title={top.title}
                  >
                    {top.title}
                  </p>
                  <p className="text-[10px] text-brand-blue-700/80 dark:text-brand-blue-100/80 tabular-nums">
                    {top.count} candidatos
                  </p>
                </div>
              )}
            </div>

            <div className="w-full rounded-xl bg-muted/40 p-3">
              <div
                style={{
                  height: Math.max(sorted.length * 52 + 40, 220),
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sorted}
                    layout="vertical"
                    margin={{ left: 8, right: 56, top: 8, bottom: 8 }}
                    barCategoryGap="22%"
                  >
                    <defs>
                      <linearGradient id="cpv-grad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#6873D7" stopOpacity={0.7} />
                        <stop offset="100%" stopColor="#31359C" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 4"
                      stroke="hsl(var(--border))"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      domain={[0, xMax]}
                      label={{
                        value: 'candidatos',
                        position: 'insideBottomRight',
                        offset: -4,
                        style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))' },
                      }}
                    />
                    <YAxis
                      type="category"
                      dataKey="title"
                      stroke="hsl(var(--foreground))"
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      width={240}
                      tick={<VacancyYAxisTick />}
                    />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid hsl(var(--border))',
                        background: 'hsl(var(--popover))',
                        fontSize: 12,
                        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                      }}
                      formatter={(value: any) => [`${value} candidatos`, 'En proceso']}
                      labelFormatter={(label: any) => label}
                    />
                    <Bar
                      dataKey="count"
                      fill="url(#cpv-grad)"
                      radius={[0, 8, 8, 0]}
                      minPointSize={4}
                    >
                      <LabelList
                        dataKey="count"
                        position="right"
                        fontSize={13}
                        fontWeight={800}
                        fill="hsl(var(--foreground))"
                        offset={8}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Tiempo promedio de revision por Head — desde tabla "Tiempo de revision (head)"
// ============================================================================
export interface HeadReviewRow {
  head: string;       // Nombre del Head
  avgDays: number;    // dias promedio
  count: number;      // n de revisiones
}

export function HeadReviewTimeChart({ data }: { data: HeadReviewRow[] }) {
  const sorted = [...data].sort((a, b) => b.avgDays - a.avgDays);
  const maxDays = Math.max(...sorted.map((d) => d.avgDays), 1);
  const xMax = Math.ceil(maxDays * 1.2) || 1;
  const overall =
    sorted.length === 0
      ? 0
      : Math.round(
          (sorted.reduce((acc, d) => acc + d.avgDays * d.count, 0) /
            sorted.reduce((acc, d) => acc + d.count, 0)) *
            10,
        ) / 10;
  const slowest = sorted[0];
  const fastest = sorted[sorted.length - 1];

  // Color por velocidad: <=2 dias verde, <=5 azul, >5 gold/rojo
  const colorFor = (days: number) => {
    if (days <= 2) return PRIORITY_COLORS.Baja;   // verde-aqua
    if (days <= 5) return PRIORITY_COLORS.Media;  // azul brand
    return PRIORITY_COLORS.Alta;                  // rojo
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Tiempo de revisión por Head</CardTitle>
            <CardDescription>
              Días promedio entre envío de CV y retorno · por hiring manager
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <LegendDot color={PRIORITY_COLORS.Baja.solid} label="≤ 2 d" />
            <LegendDot color={PRIORITY_COLORS.Media.solid} label="3 – 5 d" />
            <LegendDot color={PRIORITY_COLORS.Alta.solid} label="> 5 d" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center rounded-xl bg-muted/40 p-6 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Sin revisiones registradas
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Cuando se carguen registros con envío y retorno de CV aparecerán aquí.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Heads
                </p>
                <p className="mt-0.5 font-display text-2xl font-bold text-foreground tabular-nums">
                  {sorted.length}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Promedio global
                </p>
                <p className="mt-0.5 font-display text-2xl font-bold text-foreground tabular-nums">
                  {overall} d
                </p>
              </div>
              {slowest && slowest.head !== fastest?.head && (
                <div className="col-span-2 rounded-xl border border-destructive/20 bg-destructive/5 p-3 sm:col-span-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive">
                    Más lento
                  </p>
                  <p
                    className="mt-0.5 truncate font-display text-sm font-bold text-destructive"
                    title={slowest.head}
                  >
                    {slowest.head}
                  </p>
                  <p className="text-[10px] text-destructive/80 tabular-nums">
                    {slowest.avgDays} d · {slowest.count} revisiones
                  </p>
                </div>
              )}
            </div>

            <div className="w-full rounded-xl bg-muted/40 p-3">
              <div
                style={{
                  height: Math.max(sorted.length * 52 + 40, 220),
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sorted}
                    layout="vertical"
                    margin={{ left: 8, right: 56, top: 8, bottom: 8 }}
                    barCategoryGap="22%"
                  >
                    <defs>
                      {(['Alta', 'Media', 'Baja'] as const).map((p) => {
                        const c = PRIORITY_COLORS[p];
                        return (
                          <linearGradient
                            key={`rev-${p}`}
                            id={`rev-${p}`}
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="0"
                          >
                            <stop offset="0%" stopColor={c.from} stopOpacity={0.7} />
                            <stop offset="100%" stopColor={c.to} stopOpacity={1} />
                          </linearGradient>
                        );
                      })}
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 4"
                      stroke="hsl(var(--border))"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals
                      domain={[0, xMax]}
                      label={{
                        value: 'días',
                        position: 'insideBottomRight',
                        offset: -4,
                        style: { fontSize: 11, fill: 'hsl(var(--muted-foreground))' },
                      }}
                    />
                    <YAxis
                      type="category"
                      dataKey="head"
                      stroke="hsl(var(--foreground))"
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      width={200}
                      tick={<VacancyYAxisTick />}
                    />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid hsl(var(--border))',
                        background: 'hsl(var(--popover))',
                        fontSize: 12,
                        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                      }}
                      formatter={(value: any, _name: any, payload: any) => {
                        const row = payload?.payload as HeadReviewRow | undefined;
                        return [
                          `${value} días · ${row?.count ?? 0} revisiones`,
                          'Promedio',
                        ];
                      }}
                      labelFormatter={(label: any) => label}
                    />
                    <Bar dataKey="avgDays" radius={[0, 8, 8, 0]} minPointSize={4}>
                      {sorted.map((d, i) => {
                        const palette = colorFor(d.avgDays);
                        const bucket =
                          d.avgDays <= 2 ? 'Baja' : d.avgDays <= 5 ? 'Media' : 'Alta';
                        return (
                          <Cell
                            key={i}
                            fill={`url(#rev-${bucket})`}
                            stroke={palette.solid}
                            strokeOpacity={0}
                          />
                        );
                      })}
                      <LabelList
                        dataKey="avgDays"
                        position="right"
                        fontSize={12}
                        fontWeight={800}
                        fill="hsl(var(--foreground))"
                        offset={8}
                        formatter={(v: any) => `${v} d`}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5">
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: color, boxShadow: `0 0 6px ${color}66` }}
      />
      <span className="font-semibold text-foreground">{label}</span>
    </span>
  );
}
