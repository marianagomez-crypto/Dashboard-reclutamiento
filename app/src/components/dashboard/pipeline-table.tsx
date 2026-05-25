'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Search, Users2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { STAGE_COLORS, type Stage } from '@/lib/types';
import { initials } from '@/lib/utils';

// Solo las 5 etapas del pipeline visibles en la tabla (sin "Ingreso").
const PIPELINE_STAGES: Stage[] = [
  'Screening',
  'Entrevista T&C',
  'Entrevista líder',
  'Prueba Tecnica',
  'Oferta',
];

const STAGE_LABEL: Record<Stage, string> = {
  Screening: 'Screening',
  'Entrevista T&C': 'Entrevista T&C',
  'Entrevista líder': 'Entrevista líder',
  'Prueba Tecnica': 'Prueba técnica',
  Oferta: 'Oferta',
  Ingreso: 'Ingreso',
};

export interface PipelineRow {
  candidateId: string;
  name: string;
  vacancyId?: string;
  vacancyTitle: string;
  stage: Stage;
}

export function PipelineTable({ rows }: { rows: PipelineRow[] }) {
  const [search, setSearch] = React.useState('');
  const [stageFilter, setStageFilter] = React.useState<Stage | 'all'>('all');

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase().trim();
    return rows.filter((r) => {
      if (stageFilter !== 'all' && r.stage !== stageFilter) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.vacancyTitle.toLowerCase().includes(q) ||
        (r.vacancyId || '').toLowerCase().includes(q)
      );
    });
  }, [rows, search, stageFilter]);

  const countsByStage = React.useMemo(() => {
    const acc = PIPELINE_STAGES.reduce(
      (m, s) => ({ ...m, [s]: 0 }),
      {} as Record<Stage, number>,
    );
    rows.forEach((r) => {
      if (acc[r.stage] !== undefined) acc[r.stage] += 1;
    });
    return acc;
  }, [rows]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Pipeline de candidatos en proceso</CardTitle>
            <CardDescription>
              {rows.length} candidatos · solo vacantes abiertas · estado "En proceso"
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, puesto..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Chips de etapa con contador — funcionan como filtro */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStageFilter('all')}
            className={`group inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
              stageFilter === 'all'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card text-muted-foreground hover:border-border/60 hover:text-foreground'
            }`}
          >
            Todas
            <span className="tabular-nums">{rows.length}</span>
          </button>
          {PIPELINE_STAGES.map((s) => {
            const active = stageFilter === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStageFilter(active ? 'all' : s)}
                className={`group inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  active
                    ? 'text-white shadow-sm'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground'
                }`}
                style={
                  active
                    ? {
                        background: STAGE_COLORS[s],
                        borderColor: STAGE_COLORS[s],
                        boxShadow: `0 0 12px ${STAGE_COLORS[s]}55`,
                      }
                    : undefined
                }
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: active ? '#fff' : STAGE_COLORS[s] }}
                />
                {STAGE_LABEL[s]}
                <span className="tabular-nums">{countsByStage[s] || 0}</span>
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent>
        {filtered.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center rounded-xl bg-muted/40 p-6 text-center">
            <Users2 className="mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              No hay candidatos que coincidan
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Ajusta el filtro o limpia la búsqueda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[860px] border-collapse text-sm">
              <thead>
                <tr className="bg-muted/40 text-left">
                  <th className="sticky left-0 z-10 bg-muted/40 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Candidato
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Puesto / Vacante
                  </th>
                  {PIPELINE_STAGES.map((s) => (
                    <th
                      key={s}
                      className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: STAGE_COLORS[s] }}
                        />
                        <span className="leading-tight">{STAGE_LABEL[s]}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <motion.tr
                    key={row.candidateId}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.015, 0.3) }}
                    className="border-t border-border transition-colors hover:bg-muted/30"
                  >
                    <td className="sticky left-0 z-10 bg-card px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-[11px]">
                            {initials(row.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="leading-tight">
                          <p className="font-medium text-foreground">{row.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {row.candidateId}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{row.vacancyTitle}</p>
                      {row.vacancyId && (
                        <p className="text-[11px] text-muted-foreground">{row.vacancyId}</p>
                      )}
                    </td>
                    {PIPELINE_STAGES.map((s) => {
                      const active = row.stage === s;
                      const color = STAGE_COLORS[s];
                      return (
                        <td
                          key={s}
                          className="relative px-3 py-3 text-center"
                          style={
                            active
                              ? {
                                  background: `${color}1A`,
                                  boxShadow: `inset 0 0 0 1px ${color}66`,
                                }
                              : undefined
                          }
                        >
                          {active ? (
                            <Badge
                              variant="outline"
                              className="border-transparent text-white"
                              style={{
                                background: color,
                                boxShadow: `0 4px 12px ${color}55`,
                              }}
                            >
                              Aquí
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground/30">·</span>
                          )}
                        </td>
                      );
                    })}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
