'use client';

import * as React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { EXAM_RESULT_COLORS } from '@/lib/types';

const TOOLTIP = {
  borderRadius: 12,
  border: '1px solid hsl(var(--border))',
  background: 'hsl(var(--popover))',
  fontSize: 12,
} as const;
const TEAL = '#00A29B';
const AMBER = '#CA8A04';

function money(n: number): string {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN', maximumFractionDigits: 0 }).format(n);
}
function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="flex h-32 flex-col items-center justify-center rounded-xl bg-muted/40 p-6 text-center">
      <p className="text-sm font-medium text-muted-foreground">{text}</p>
    </div>
  );
}

// ============================================================================
// 1) Dona: hechos vs faltan (sobre colaboradores activos)
// ============================================================================
export function HechosFaltanDonut({ hechos, faltan }: { hechos: number; faltan: number }) {
  const total = hechos + faltan;
  const data = [
    { name: 'Hechos', value: hechos },
    { name: 'Faltan', value: faltan },
  ];
  return (
    <Card>
      <CardHeader>
        <div className="flex items-end justify-between gap-3">
          <div>
            <CardTitle>Avance de exámenes</CardTitle>
            <CardDescription>Colaboradores activos con examen vs pendientes</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Legend color={TEAL} label="Hechos" />
            <Legend color={AMBER} label="Faltan" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <Empty text="Sin colaboradores activos" />
        ) : (
          <div className="relative mx-auto h-56 w-full max-w-sm">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={2} strokeWidth={0} startAngle={90} endAngle={-270}>
                  <Cell fill={TEAL} />
                  <Cell fill={AMBER} />
                </Pie>
                <Tooltip
                  contentStyle={TOOLTIP}
                  formatter={(v: any, n: any) => [`${v} (${total ? Math.round((Number(v) / total) * 100) : 0}%)`, n]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-3xl font-bold leading-none tabular-nums text-foreground">
                {total ? Math.round((hechos / total) * 100) : 0}%
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {hechos}/{total} hechos
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// 2) Inversión por mes (May–Dic)
// ============================================================================
export function InversionPorMesChart({ data }: { data: { mes: string; total: number }[] }) {
  const total = data.reduce((a, d) => a + d.total, 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inversión por mes</CardTitle>
        <CardDescription>Costo de exámenes por mes de realización · {money(total)} total</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full rounded-xl bg-muted/40 p-3">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: 4, right: 12, top: 16, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 4" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v: any) => `S/${v}`} />
              <Tooltip cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }} contentStyle={TOOLTIP} formatter={(v: any) => [money(Number(v)), 'Invertido']} />
              <Bar dataKey="total" radius={[8, 8, 0, 0]} fill={TEAL}>
                <LabelList dataKey="total" position="top" formatter={(v: any) => (Number(v) > 0 ? money(Number(v)) : '')} fontSize={10} fontWeight={700} fill="hsl(var(--foreground))" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// 3) Exámenes realizados por área (stacked por resultado)
// ============================================================================
export interface AreaExamRow {
  area: string;
  Apto: number;
  'Apto con observaciones': number;
  'Con observaciones': number;
}
const RESULT_KEYS: { key: keyof Omit<AreaExamRow, 'area'>; color: string }[] = [
  { key: 'Apto', color: EXAM_RESULT_COLORS.Apto },
  { key: 'Apto con observaciones', color: EXAM_RESULT_COLORS['Apto con observaciones'] },
  { key: 'Con observaciones', color: EXAM_RESULT_COLORS['Con observaciones'] },
];

export function ExamenesPorAreaChart({ data }: { data: AreaExamRow[] }) {
  const sorted = [...data].sort((a, b) => {
    const ta = a.Apto + a['Apto con observaciones'] + a['Con observaciones'];
    const tb = b.Apto + b['Apto con observaciones'] + b['Con observaciones'];
    return tb - ta;
  });
  return (
    <Card>
      <CardHeader>
        <div className="flex items-end justify-between gap-3">
          <div>
            <CardTitle>Exámenes realizados por área</CardTitle>
            <CardDescription>Cantidad por área · apilado por resultado</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Legend color={EXAM_RESULT_COLORS.Apto} label="Apto" />
            <Legend
              color={EXAM_RESULT_COLORS['Apto con observaciones']}
              label="Apto con observaciones"
            />
            <Legend color={EXAM_RESULT_COLORS['Con observaciones']} label="Con observaciones" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <Empty text="Sin exámenes registrados" />
        ) : (
          <div className="w-full rounded-xl bg-muted/40 p-3">
            <div style={{ height: Math.max(sorted.length * 46 + 40, 220) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sorted} layout="vertical" margin={{ left: 8, right: 24, top: 8, bottom: 8 }} barCategoryGap="22%">
                  <CartesianGrid strokeDasharray="3 4" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="area" stroke="hsl(var(--foreground))" fontSize={12} fontWeight={600} tickLine={false} axisLine={false} width={170} interval={0} />
                  <Tooltip cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }} contentStyle={TOOLTIP} />
                  {RESULT_KEYS.map((r) => (
                    <Bar key={r.key} dataKey={r.key} name={r.key} stackId="ex" fill={r.color} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// 4) Faltan por área (click → nombres)
// ============================================================================
export interface FaltanAreaRow {
  area: string;
  value: number;
  names: string[];
}
export function FaltanPorAreaChart({ data }: { data: FaltanAreaRow[] }) {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const max = Math.max(...sorted.map((d) => d.value), 1);
  const xMax = Math.ceil(max * 1.18) + 1;
  const total = sorted.reduce((a, d) => a + d.value, 0);
  const [sel, setSel] = React.useState<string | null>(null);
  const selected = sorted.find((d) => d.area === sel) || null;

  function click(payload: any) {
    const area = payload?.area;
    if (area) setSel((p) => (p === area ? null : area));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pendientes por área</CardTitle>
        <CardDescription>
          Colaboradores activos sin examen · {total} en total · tocá un área para ver los nombres
        </CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <Empty text="Todos los activos ya tienen examen" />
        ) : (
          <>
            <div className="w-full rounded-xl bg-muted/40 p-3">
              <div style={{ height: Math.max(sorted.length * 44 + 40, 200) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sorted}
                    layout="vertical"
                    margin={{ left: 8, right: 32, top: 8, bottom: 8 }}
                    barCategoryGap="22%"
                    onClick={(s: any) => click(s?.activePayload?.[0]?.payload)}
                  >
                    <defs>
                      <linearGradient id="faltan-grad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={AMBER} stopOpacity={0.55} />
                        <stop offset="100%" stopColor={AMBER} stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 4" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} domain={[0, xMax]} />
                    <YAxis type="category" dataKey="area" stroke="hsl(var(--foreground))" fontSize={12} fontWeight={600} tickLine={false} axisLine={false} width={170} interval={0} />
                    <Tooltip cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }} contentStyle={TOOLTIP} formatter={(v: any) => [`${v} pendiente${Number(v) === 1 ? '' : 's'}`, 'Faltan']} />
                    <Bar dataKey="value" radius={[0, 10, 10, 0]} minPointSize={3} fill="url(#faltan-grad)" cursor="pointer">
                      <LabelList dataKey="value" position="right" fontSize={13} fontWeight={800} fill="hsl(var(--foreground))" offset={8} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            {selected && (
              <div className="mt-4 rounded-xl border border-border bg-background/60 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">
                    {selected.area}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {selected.value} sin examen
                    </span>
                  </p>
                  <button type="button" onClick={() => setSel(null)} className="text-xs font-medium text-muted-foreground hover:text-foreground">
                    Cerrar
                  </button>
                </div>
                <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {selected.names.map((n) => (
                    <li key={n} className="flex items-center gap-2 rounded-lg bg-muted/50 px-2.5 py-1.5 text-sm text-foreground">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: AMBER }} />
                      <span className="truncate" title={n}>{n}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
