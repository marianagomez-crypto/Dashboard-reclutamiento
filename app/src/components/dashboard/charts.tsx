'use client';

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
import { Filter, UserX, TrendingDown, Lightbulb } from 'lucide-react';

const PIE_COLORS = ['#31359C', '#00A29B', '#FDCA56', '#6873D7', '#36B7B3', '#D1A646', '#98A9DF'];

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

function pieLabel(props: any) {
  const { cx, cy, midAngle, outerRadius, percent, value, name } = props;
  if (!value) return null;
  const RAD = Math.PI / 180;
  const radius = outerRadius + 18;
  const x = cx + radius * Math.cos(-midAngle * RAD);
  const y = cy + radius * Math.sin(-midAngle * RAD);
  return (
    <text
      x={x}
      y={y}
      fill="hsl(var(--foreground))"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={11}
      fontWeight={600}
    >
      {`${name}: ${value} (${Math.round(percent * 100)}%)`}
    </text>
  );
}

export function SourceChart({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fuentes de candidatos</CardTitle>
        <CardDescription>Top canales de adquisición · {total} total</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full rounded-xl bg-muted/40 p-3">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={45}
                outerRadius={72}
                paddingAngle={3}
                strokeWidth={0}
                label={pieLabel}
                labelLine={false}
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
              />
              <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
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
