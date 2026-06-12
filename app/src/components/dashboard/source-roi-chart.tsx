'use client';

import * as React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
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
import { Trophy } from 'lucide-react';

export interface HireSourceRow {
  candidateName: string;
  vacancyTitle: string;
  vacancyId: string;
  channel: string;
  invested: boolean;
  channelCost: number;
  vacancyTotalCost: number; // inversión total de la vacante (todos los canales)
}

export interface ChannelHireStat {
  channel: string;
  hires: number;
  invested: number; // S/ atado a las contrataciones de ese canal
}

export interface VacancyInvestmentRow {
  vacancyTitle: string;
  total: number;
  canal: number; // invertido en el/los canal(es) que contrataron
  otros: number; // resto de la inversión de la vacante
}

const CHANNEL_COLORS: Record<string, string> = {
  Linkedin: '#0A66C2',
  LinkedIn: '#0A66C2',
  Bumeran: '#F97316',
  Facebook: '#1877F2',
  Referidos: '#9333EA',
  Referido: '#9333EA',
  Computrabajo: '#16A34A',
  'Universidad de Lima': '#EAB308',
  'Universidad del Pacífico': '#1E3A8A',
};
const FALLBACK = ['#6873D7', '#36B7B3', '#D14646', '#987933', '#4453A0', '#D17AA6'];
function channelColor(name: string, i: number): string {
  return CHANNEL_COLORS[name] || FALLBACK[i % FALLBACK.length];
}

function formatPEN(n: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    maximumFractionDigits: 0,
  }).format(n);
}

export function HiresBySourceChart({
  rows,
  byChannel,
  investmentByVacancy,
}: {
  rows: HireSourceRow[];
  byChannel: ChannelHireStat[];
  investmentByVacancy: VacancyInvestmentRow[];
}) {
  const total = rows.length;
  const pagas = rows.filter((r) => r.invested).length;
  const organicas = total - pagas;
  const invertido = rows.reduce((acc, r) => acc + (r.invested ? r.channelCost : 0), 0);
  // Inversión total por vacantes contratadas, SIN duplicar vacantes
  // (investmentByVacancy ya viene deduplicado por vacante).
  const invertidoTotal = investmentByVacancy.reduce((acc, r) => acc + r.total, 0);

  const sortedChannels = [...byChannel].sort((a, b) => b.hires - a.hires);
  const maxHires = Math.max(...sortedChannels.map((c) => c.hires), 1);
  const xMax = Math.ceil(maxHires * 1.18) + 1;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Contrataciones por fuente · efectividad de inversión</CardTitle>
            <CardDescription>
              De dónde salieron los contratados y si ese canal tuvo inversión
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Legend color="#00A29B" label="Con inversión" />
            <Legend color="#94A3B8" label="Sin costo" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center rounded-xl bg-muted/40 p-6 text-center">
            <Trophy className="mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              Aún no hay contrataciones
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Cuando un candidato pase a "Contratado" aparecerá acá con su canal de origen.
            </p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-5">
              <Stat label="Contrataciones" value={String(total)} />
              <Stat label="Por canal pago" value={String(pagas)} color="#00A29B" />
              <Stat label="Sin costo" value={String(organicas)} color="#94A3B8" />
              <Stat label="Invertido en canales que contrataron" value={formatPEN(invertido)} />
              <Stat label="Inversión total · vacantes contratadas" value={formatPEN(invertidoTotal)} />
            </div>

            {/* Bar chart: contrataciones por canal */}
            <div className="mb-5 w-full rounded-xl bg-muted/40 p-3">
              <div style={{ height: Math.max(sortedChannels.length * 46 + 30, 180) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sortedChannels}
                    layout="vertical"
                    margin={{ left: 8, right: 36, top: 8, bottom: 8 }}
                    barCategoryGap="24%"
                  >
                    <CartesianGrid strokeDasharray="3 4" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis
                      type="number"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      domain={[0, xMax]}
                    />
                    <YAxis
                      type="category"
                      dataKey="channel"
                      stroke="hsl(var(--foreground))"
                      fontSize={12}
                      fontWeight={600}
                      tickLine={false}
                      axisLine={false}
                      width={150}
                      interval={0}
                    />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid hsl(var(--border))',
                        background: 'hsl(var(--popover))',
                        fontSize: 12,
                      }}
                      formatter={(v: any, _n: any, p: any) => {
                        const inv = p?.payload?.invested || 0;
                        return [
                          `${v} contratacion${Number(v) === 1 ? '' : 'es'} · ${formatPEN(inv)} invertido`,
                          'Canal',
                        ];
                      }}
                    />
                    <Bar dataKey="hires" radius={[0, 10, 10, 0]} minPointSize={3}>
                      {sortedChannels.map((c, i) => (
                        <Cell key={c.channel} fill={channelColor(c.channel, i)} />
                      ))}
                      <LabelList
                        dataKey="hires"
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

            {/* Detalle por contratado: vacante + canal + inversión */}
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[640px] border-collapse text-sm">
                <thead>
                  <tr className="bg-muted/40 text-left">
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Vacante
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Contratado
                    </th>
                    <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Canal
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Inversión en ese canal
                    </th>
                    <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Inversión total (vacante)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const color = channelColor(r.channel, i);
                    return (
                      <tr key={`${r.vacancyId}-${r.candidateName}-${i}`} className="border-t border-border">
                        <td className="px-3 py-2.5">
                          <p className="font-medium text-foreground">{r.vacancyTitle}</p>
                          <p className="font-mono text-[11px] text-muted-foreground">{r.vacancyId}</p>
                        </td>
                        <td className="px-3 py-2.5 text-foreground">{r.candidateName}</td>
                        <td className="px-3 py-2.5">
                          <span
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                            style={{ background: `${color}1A`, color }}
                          >
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                            {r.channel || '—'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {r.invested ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00A29B1A] px-2.5 py-0.5 text-[11px] font-semibold text-[#00A29B] tabular-nums">
                              {formatPEN(r.channelCost)} · con inversión
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                              Sin costo
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-foreground">
                          {r.vacancyTotalCost > 0 ? formatPEN(r.vacancyTotalCost) : '—'}
                        </td>
                      </tr>
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

function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className="mt-0.5 font-display text-xl font-bold tabular-nums"
        style={color ? { color } : undefined}
      >
        {value}
      </p>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}
