'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertTriangle, Coins, Target, TrendingUp } from 'lucide-react';

// Una fila por candidato contratado.
export interface CandidateAttributionRow {
  id: string;
  candidateName: string;
  vacancyTitle: string;
  inversion: number; // total invertido en fuentes pagadas de su vacante
  atribuible: number; // invertido en el canal que generó SU contratación
  finalSource: string; // canal de la contratación
}

// Totales reales (deduplicados por vacante para no contar dos veces la inversión
// de una vacante con varios contratados).
export interface AttributionTotals {
  inversion: number;
  atribuible: number;
}

const COLOR_INVERSION = '#F0B429'; // dorado
const COLOR_ATRIBUIBLE = '#E5484D'; // rojo

const CHANNEL_COLORS: Record<string, string> = {
  Linkedin: '#0A66C2',
  LinkedIn: '#0A66C2',
  Bumeran: '#F97316',
  Facebook: '#1877F2',
  Referidos: '#7C3AED',
  Referido: '#7C3AED',
  Computrabajo: '#16A34A',
  'Universidad de Lima': '#EAB308',
  'Universidad del Pacífico': '#1E3A8A',
};
function channelColor(name: string): string {
  return CHANNEL_COLORS[name] || '#64748B';
}

function formatPEN(n: number): string {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    maximumFractionDigits: 0,
  }).format(n);
}

function niceMax(v: number): number {
  if (v <= 0) return 100;
  const pow = Math.pow(10, Math.floor(Math.log10(v)));
  const stepped = Math.ceil(v / (pow / 2)) * (pow / 2);
  return stepped <= v ? stepped + pow / 2 : stepped;
}

export function InvestmentAttributionChart({
  rows,
  totals,
}: {
  rows: CandidateAttributionRow[];
  totals: AttributionTotals;
}) {
  // Mayor gap primero — resalta los casos de alta inversión y baja atribución.
  const sorted = React.useMemo(
    () =>
      [...rows].sort(
        (a, b) =>
          b.inversion - b.atribuible - (a.inversion - a.atribuible) ||
          b.inversion - a.inversion,
      ),
    [rows],
  );

  const inversionTotal = totals.inversion;
  const atribuibleTotal = totals.atribuible;
  const gapTotal = Math.max(0, inversionTotal - atribuibleTotal);
  const efectividad = inversionTotal > 0 ? (atribuibleTotal / inversionTotal) * 100 : 0;

  const AREA = 250; // alto del área de barras (px)
  const scaleMax = niceMax(Math.max(...sorted.map((r) => r.inversion), 0));
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  // Caso más representativo del mensaje: invertí pero no fue atribuible.
  const worst =
    sorted.find((r) => r.inversion > 0 && r.atribuible === 0) || sorted[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">
          Inversión en reclutamiento vs. costo real atribuible
        </CardTitle>
        <CardDescription className="mt-1">
          Por candidato contratado · cuánto se invirtió en canales pagados vs el canal
          que realmente generó la contratación
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* KPIs — fila completa */}
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi
            icon={<Coins className="h-4 w-4" />}
            label="Inversión total"
            value={formatPEN(inversionTotal)}
            accent={COLOR_INVERSION}
          />
          <Kpi
            icon={<Target className="h-4 w-4" />}
            label="Costo atribuible"
            value={formatPEN(atribuibleTotal)}
            accent={COLOR_ATRIBUIBLE}
          />
          <Kpi
            icon={<TrendingUp className="h-4 w-4" />}
            label="Efectividad"
            value={`${Math.round(efectividad)}%`}
            accent="#0E7A6B"
          />
          <Kpi
            icon={<AlertTriangle className="h-4 w-4" />}
            label="No atribuible"
            value={formatPEN(gapTotal)}
            accent="#94A3B8"
          />
        </div>

        {sorted.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center rounded-xl bg-muted/40 p-6 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Aún no hay contrataciones con inversión registrada
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Cuando un candidato pase a "Contratado" y su vacante tenga fuentes con
              costo, verás acá la comparación por candidato.
            </p>
          </div>
        ) : (
          <>
            {/* Leyenda */}
            <div className="mb-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
              <LegendItem color={COLOR_INVERSION} label="Inversión realizada" sub="portales y fuentes pagadas" />
              <LegendItem color={COLOR_ATRIBUIBLE} label="Costo real atribuible" sub="canal que generó la contratación" />
              <LegendItem dashed label="Gap · inversión no atribuible" sub="se pagó, pero la contratación vino por otro canal" />
            </div>

            {/* Gráfico */}
            <div className="overflow-x-auto pb-2">
              <div className="relative min-w-[640px] pl-14" style={{ height: AREA + 30 }}>
                {/* Gridlines + etiquetas del eje */}
                {ticks.map((t) => (
                  <div
                    key={t}
                    className="pointer-events-none absolute left-14 right-0 border-t border-dashed border-border/70"
                    style={{ bottom: 30 + t * AREA }}
                  >
                    <span className="absolute -left-14 -top-2 w-12 text-right text-[10px] tabular-nums text-muted-foreground">
                      {formatPEN(scaleMax * t)}
                    </span>
                  </div>
                ))}

                {/* Columnas por candidato */}
                <div
                  className="absolute bottom-[30px] left-14 right-0 flex items-end justify-around gap-4"
                  style={{ height: AREA }}
                >
                  {sorted.map((r) => {
                    const invPx = (r.inversion / scaleMax) * AREA;
                    const atrPx = (r.atribuible / scaleMax) * AREA;
                    const gap = Math.max(0, r.inversion - r.atribuible);
                    return (
                      <div
                        key={r.id}
                        className="flex min-w-[92px] max-w-[150px] flex-1 items-end justify-center gap-2"
                      >
                        {/* Barra inversión (dorada, sólida) */}
                        <div className="flex w-9 flex-col items-center">
                          <span
                            className="mb-1 whitespace-nowrap text-[11px] font-bold tabular-nums"
                            style={{ color: '#A16207' }}
                          >
                            {formatPEN(r.inversion)}
                          </span>
                          <div
                            className="w-full rounded-t-md"
                            style={{
                              height: Math.max(invPx, 2),
                              background: `linear-gradient(180deg, ${COLOR_INVERSION} 0%, #E89611 100%)`,
                            }}
                          />
                        </div>

                        {/* Barra atribuible (roja) dentro de caja punteada = gap */}
                        <div className="flex w-9 flex-col items-center">
                          <span
                            className="mb-1 whitespace-nowrap text-[11px] font-bold tabular-nums"
                            style={{ color: r.atribuible > 0 ? COLOR_ATRIBUIBLE : '#94A3B8' }}
                          >
                            {formatPEN(r.atribuible)}
                          </span>
                          <div
                            className="relative w-full overflow-hidden rounded-t-md border border-dashed border-muted-foreground/40"
                            style={{ height: Math.max(invPx, 2) }}
                          >
                            {/* Etiqueta del gap, en la zona vacía */}
                            {gap > 0 && invPx - atrPx > 18 && (
                              <span className="absolute left-0 right-0 top-1 text-center text-[9px] font-semibold tabular-nums text-muted-foreground">
                                {formatPEN(gap)}
                              </span>
                            )}
                            {/* Relleno rojo = atribuible */}
                            <div
                              className="absolute bottom-0 left-0 right-0 rounded-t-[3px]"
                              style={{
                                height: Math.max(atrPx, r.atribuible > 0 ? 3 : 0),
                                background: `linear-gradient(180deg, ${COLOR_ATRIBUIBLE} 0%, #C2362B 100%)`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer por candidato: nombre + puesto + fuente final */}
              <div className="min-w-[640px] pl-14">
                <div className="flex items-start justify-around gap-4">
                  {sorted.map((r) => {
                    const c = channelColor(r.finalSource);
                    return (
                      <div
                        key={r.id}
                        className="flex min-w-[92px] max-w-[150px] flex-1 flex-col items-center gap-1 text-center"
                      >
                        <p
                          className="line-clamp-1 text-[11px] font-bold text-foreground"
                          title={r.candidateName}
                        >
                          {r.candidateName}
                        </p>
                        <p
                          className="line-clamp-1 text-[10px] uppercase tracking-wide text-muted-foreground"
                          title={r.vacancyTitle}
                        >
                          {r.vacancyTitle}
                        </p>
                        <div className="mt-0.5 flex items-center gap-1.5 rounded-lg border border-border bg-muted/40 px-2 py-1">
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ background: c }}
                          />
                          <span
                            className="truncate text-[11px] font-semibold"
                            style={{ color: c }}
                            title={r.finalSource}
                          >
                            {r.finalSource}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Lectura / insight */}
            {worst && worst.inversion > 0 && (
              <div className="mt-5 flex items-start gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <p className="text-xs text-muted-foreground">
                  {worst.atribuible === 0 ? (
                    <>
                      <span className="font-semibold text-foreground">Lectura:</span> para{' '}
                      <span className="font-semibold text-foreground">{worst.candidateName}</span>{' '}
                      ({worst.vacancyTitle}) se invirtieron {formatPEN(worst.inversion)} en
                      fuentes pagadas, pero la contratación llegó por{' '}
                      <span className="font-semibold" style={{ color: channelColor(worst.finalSource) }}>
                        {worst.finalSource}
                      </span>{' '}
                      → costo atribuible {formatPEN(0)}. Esa inversión no contribuyó a la
                      contratación final.
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-foreground">Lectura:</span> del total
                      invertido ({formatPEN(inversionTotal)}), solo {formatPEN(atribuibleTotal)}{' '}
                      ({Math.round(efectividad)}%) fue al canal que realmente generó las
                      contrataciones. {formatPEN(gapTotal)} se pagó sin atribución directa.
                    </>
                  )}
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Kpi({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center gap-2">
        <span
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
          style={{ background: `${accent}1A`, color: accent }}
        >
          {icon}
        </span>
        <span className="text-[11px] font-semibold uppercase leading-tight tracking-wide text-muted-foreground">
          {label}
        </span>
      </div>
      <p
        className="mt-2 font-display text-2xl font-bold tabular-nums"
        style={{ color: accent }}
      >
        {value}
      </p>
    </div>
  );
}

function LegendItem({
  color,
  dashed,
  label,
  sub,
}: {
  color?: string;
  dashed?: boolean;
  label: string;
  sub: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {dashed ? (
        <span className="h-3 w-3 shrink-0 rounded-[3px] border border-dashed border-muted-foreground/60" />
      ) : (
        <span className="h-3 w-3 shrink-0 rounded-[3px]" style={{ background: color }} />
      )}
      <div className="leading-tight">
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}
